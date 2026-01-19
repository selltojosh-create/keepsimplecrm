import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from './redis';

export interface AutomationJobData {
  type: 'execute_step' | 'enroll_lead' | 'process_trigger';
  enrollmentId?: string;
  automationId: string;
  leadId: string;
  organizationId: string;
  stepPosition?: number;
  triggerType?: string;
}

let automationQueue: Queue | null = null;

export const getAutomationQueue = () => {
  if (!automationQueue) {
    automationQueue = new Queue('automations', {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 1000,
          age: 24 * 60 * 60, // 24 hours
        },
        removeOnFail: {
          count: 5000,
        },
      },
    });
  }
  return automationQueue;
};

export const enqueueAutomationStep = async (data: AutomationJobData, delayMs?: number) => {
  const queue = getAutomationQueue();

  const jobOptions = delayMs ? { delay: delayMs } : {};

  await queue.add(`automation-${data.automationId}`, data, jobOptions);
};

export const enrollLeadInAutomation = async (
  automationId: string,
  leadId: string,
  organizationId: string
) => {
  await enqueueAutomationStep({
    type: 'enroll_lead',
    automationId,
    leadId,
    organizationId,
  });
};
