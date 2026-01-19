import { db } from '@/lib/db';
import {
  automations,
  automationSteps,
  automationEnrollments,
  leads,
  emailTemplates,
  timelineEntries,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail, parseEmailTemplate } from '@/lib/email';
import { enqueueAutomationStep, type AutomationJobData } from '@/lib/queue';

export async function processAutomationJob(data: AutomationJobData) {
  switch (data.type) {
    case 'enroll_lead':
      return enrollLead(data);
    case 'execute_step':
      return executeStep(data);
    case 'process_trigger':
      return processTrigger(data);
    default:
      throw new Error(`Unknown job type: ${data.type}`);
  }
}

async function enrollLead(data: AutomationJobData) {
  const { automationId, leadId, organizationId } = data;

  // Check if automation is active
  const [automation] = await db
    .select()
    .from(automations)
    .where(and(eq(automations.id, automationId), eq(automations.isActive, true)))
    .limit(1);

  if (!automation) {
    console.log('Automation not found or inactive:', automationId);
    return;
  }

  // Check if lead is already enrolled
  const [existingEnrollment] = await db
    .select()
    .from(automationEnrollments)
    .where(
      and(
        eq(automationEnrollments.automationId, automationId),
        eq(automationEnrollments.leadId, leadId),
        eq(automationEnrollments.status, 'active')
      )
    )
    .limit(1);

  if (existingEnrollment) {
    console.log('Lead already enrolled:', leadId);
    return;
  }

  // Create enrollment
  const [enrollment] = await db
    .insert(automationEnrollments)
    .values({
      organizationId,
      automationId,
      leadId,
      currentStepPosition: 0,
      status: 'active',
    })
    .returning();

  // Add timeline entry
  await db.insert(timelineEntries).values({
    organizationId,
    leadId,
    entryType: 'automation',
    content: `Enrolled in automation: ${automation.name}`,
    metadata: { automationName: automation.name },
  });

  // Queue first step
  await enqueueAutomationStep({
    type: 'execute_step',
    enrollmentId: enrollment.id,
    automationId,
    leadId,
    organizationId,
    stepPosition: 0,
  });
}

async function executeStep(data: AutomationJobData) {
  const { enrollmentId, automationId, leadId, organizationId, stepPosition } = data;

  if (!enrollmentId || stepPosition === undefined) {
    throw new Error('Missing enrollmentId or stepPosition');
  }

  // Get enrollment
  const [enrollment] = await db
    .select()
    .from(automationEnrollments)
    .where(eq(automationEnrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment || enrollment.status !== 'active') {
    console.log('Enrollment not active:', enrollmentId);
    return;
  }

  // Get step
  const [step] = await db
    .select()
    .from(automationSteps)
    .where(
      and(
        eq(automationSteps.automationId, automationId),
        eq(automationSteps.position, stepPosition)
      )
    )
    .limit(1);

  if (!step) {
    // No more steps, complete enrollment
    await db
      .update(automationEnrollments)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(automationEnrollments.id, enrollmentId));
    return;
  }

  // Get lead
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);

  if (!lead) {
    await db
      .update(automationEnrollments)
      .set({ status: 'error', errorMessage: 'Lead not found' })
      .where(eq(automationEnrollments.id, enrollmentId));
    return;
  }

  try {
    // Execute the step action
    await executeAction(step, lead, organizationId);

    // Update enrollment position
    await db
      .update(automationEnrollments)
      .set({ currentStepPosition: stepPosition + 1 })
      .where(eq(automationEnrollments.id, enrollmentId));

    // Check for wait action
    const config = step.actionConfig as Record<string, unknown> | null;
    const delayMinutes = config?.delayMinutes as number | undefined;

    if (step.actionType === 'wait' && delayMinutes) {
      await enqueueAutomationStep(
        {
          type: 'execute_step',
          enrollmentId,
          automationId,
          leadId,
          organizationId,
          stepPosition: stepPosition + 1,
        },
        delayMinutes * 60 * 1000
      );
    } else if (step.actionType !== 'stop_automation') {
      // Queue next step immediately
      await enqueueAutomationStep({
        type: 'execute_step',
        enrollmentId,
        automationId,
        leadId,
        organizationId,
        stepPosition: stepPosition + 1,
      });
    } else {
      // Stop automation
      await db
        .update(automationEnrollments)
        .set({ status: 'stopped', completedAt: new Date() })
        .where(eq(automationEnrollments.id, enrollmentId));
    }
  } catch (error) {
    console.error('Failed to execute step:', error);
    await db
      .update(automationEnrollments)
      .set({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(automationEnrollments.id, enrollmentId));
  }
}

async function executeAction(
  step: typeof automationSteps.$inferSelect,
  lead: typeof leads.$inferSelect,
  organizationId: string
) {
  const config = step.actionConfig as Record<string, unknown> | null;

  switch (step.actionType) {
    case 'send_email': {
      if (!lead.email) {
        throw new Error('Lead has no email address');
      }

      const templateId = config?.templateId as string;
      if (!templateId) {
        throw new Error('No email template configured');
      }

      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, templateId))
        .limit(1);

      if (!template) {
        throw new Error('Email template not found');
      }

      const variables = {
        firstName: lead.firstName,
        lastName: lead.lastName || '',
        email: lead.email,
        phone: lead.phone || '',
      };

      const html = parseEmailTemplate(template.bodyHtml, variables);
      const subject = parseEmailTemplate(template.subject, variables);

      await sendEmail({
        to: lead.email,
        subject,
        html,
        text: template.bodyText ? parseEmailTemplate(template.bodyText, variables) : undefined,
      });

      await db.insert(timelineEntries).values({
        organizationId,
        leadId: lead.id,
        entryType: 'email_sent',
        content: `Email sent: ${subject}`,
        metadata: { emailSubject: subject },
      });
      break;
    }

    case 'assign_user': {
      const userId = config?.userId as string;
      if (userId) {
        await db.update(leads).set({ assignedUserId: userId }).where(eq(leads.id, lead.id));

        await db.insert(timelineEntries).values({
          organizationId,
          leadId: lead.id,
          entryType: 'assignment',
          content: 'Lead assigned via automation',
          metadata: { toUser: userId },
        });
      }
      break;
    }

    case 'move_stage': {
      const stageId = config?.stageId as string;
      if (stageId) {
        await db.update(leads).set({ currentStageId: stageId }).where(eq(leads.id, lead.id));

        await db.insert(timelineEntries).values({
          organizationId,
          leadId: lead.id,
          entryType: 'stage_change',
          content: 'Stage changed via automation',
          metadata: { toStage: stageId },
        });
      }
      break;
    }

    case 'change_status': {
      const statusValue = config?.statusValue as string;
      if (statusValue) {
        await db
          .update(leads)
          .set({ status: statusValue as typeof lead.status })
          .where(eq(leads.id, lead.id));

        await db.insert(timelineEntries).values({
          organizationId,
          leadId: lead.id,
          entryType: 'status_change',
          content: `Status changed to ${statusValue} via automation`,
        });
      }
      break;
    }

    case 'add_tag': {
      const tagName = config?.tagName as string;
      if (tagName) {
        const currentTags = lead.tags || [];
        if (!currentTags.includes(tagName)) {
          await db
            .update(leads)
            .set({ tags: [...currentTags, tagName] })
            .where(eq(leads.id, lead.id));
        }
      }
      break;
    }

    case 'remove_tag': {
      const tagName = config?.tagName as string;
      if (tagName && lead.tags) {
        await db
          .update(leads)
          .set({ tags: lead.tags.filter((t) => t !== tagName) })
          .where(eq(leads.id, lead.id));
      }
      break;
    }

    case 'wait':
      // Wait is handled in executeStep
      break;

    case 'stop_automation':
      // Stop is handled in executeStep
      break;

    default:
      console.warn('Unknown action type:', step.actionType);
  }
}

async function processTrigger(data: AutomationJobData) {
  const { leadId, organizationId, triggerType } = data;

  // Find all active automations with this trigger type
  const activeAutomations = await db
    .select()
    .from(automations)
    .where(
      and(
        eq(automations.organizationId, organizationId),
        eq(automations.isActive, true),
        eq(automations.triggerType, triggerType as typeof automations.$inferSelect.triggerType)
      )
    );

  // Enroll lead in each matching automation
  for (const automation of activeAutomations) {
    await enqueueAutomationStep({
      type: 'enroll_lead',
      automationId: automation.id,
      leadId,
      organizationId,
    });
  }
}
