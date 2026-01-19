import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import bcrypt from 'bcrypt';

const { users, organizations, memberships, teams, teamMemberships, pipelines, pipelineStages } = schema;

async function main() {
  console.log('Seeding database...');
  console.log('Connecting to:', process.env.DATABASE_URL?.substring(0, 50) + '...');

  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });

  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

  // Create platform owner
  const [owner] = await db.insert(users).values({
    email: 'josh@keepsimplecrm.com',
    name: 'Josh',
    passwordHash,
    isPlatformOwner: true,
  }).returning();

  console.log('Created platform owner:', owner.email);

  // Create first organization
  const [org] = await db.insert(organizations).values({
    name: 'Isbell Rentals',
    slug: 'isbell-rentals',
  }).returning();

  console.log('Created organization:', org.name);

  // Add owner to organization as admin
  await db.insert(memberships).values({
    userId: owner.id,
    organizationId: org.id,
    orgRole: 'admin',
  });

  // Create Sales team
  const [team] = await db.insert(teams).values({
    organizationId: org.id,
    name: 'Sales',
    slug: 'sales',
    dashboardType: 'sales',
  }).returning();

  console.log('Created team:', team.name);

  // Add owner to team as manager
  await db.insert(teamMemberships).values({
    organizationId: org.id,
    teamId: team.id,
    userId: owner.id,
    teamRole: 'manager',
  });

  // Create default pipeline
  const [pipeline] = await db.insert(pipelines).values({
    organizationId: org.id,
    teamId: team.id,
    name: 'Default Pipeline',
    isDefault: true,
  }).returning();

  console.log('Created pipeline:', pipeline.name);

  // Create pipeline stages
  const stages = [
    { name: 'New', position: 0, color: '#3B82F6' },
    { name: 'Contacted', position: 1, color: '#8B5CF6' },
    { name: 'Qualified', position: 2, color: '#F59E0B' },
    { name: 'Negotiating', position: 3, color: '#EC4899' },
    { name: 'Signed', position: 4, color: '#10B981', isTerminal: true },
    { name: 'Lost', position: 5, color: '#EF4444', isTerminal: true },
  ];

  for (const stage of stages) {
    await db.insert(pipelineStages).values({
      organizationId: org.id,
      pipelineId: pipeline.id,
      ...stage,
    });
  }

  console.log('Created', stages.length, 'pipeline stages');
  console.log('');
  console.log('Seeding complete!');
  console.log('');
  console.log('Platform Owner Credentials:');
  console.log('  Email: josh@keepsimplecrm.com');
  console.log('  Password: ChangeMe123!');

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed!', err);
  process.exit(1);
});
