import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const laborRoles = [
  { fullTitle: 'Project Management - Project Manager', division: 'Delivery Management', department: 'Delivery Management', role: 'Project Manager', rackRate: 200, abbreviation: 'PM' },
  { fullTitle: 'Business Analysis - Business Analyst', division: 'Delivery Management', department: 'Delivery Management', role: 'Business Analyst', rackRate: 200, abbreviation: 'BA' },
  { fullTitle: 'Quality Assurance - Test Analyst', division: 'Delivery Management', department: 'Delivery Management', role: 'Test Analyst', rackRate: 200, abbreviation: 'QA' },
  { fullTitle: 'Design - Creative Director', division: 'Creative Services', department: 'Creative Services', role: 'Creative Director', rackRate: 200, abbreviation: 'CD' },
  { fullTitle: 'Design - Visual Designer', division: 'Creative Services', department: 'Creative Services', role: 'Visual Designer', rackRate: 200, abbreviation: 'VD' },
  { fullTitle: 'Design - UX Designer', division: 'Creative Services', department: 'Creative Services', role: 'UX Designer', rackRate: 200, abbreviation: 'IA' },
  { fullTitle: 'Content - Copywriter', division: 'Creative Services', department: 'Creative Services', role: 'Copywriter', rackRate: 200, abbreviation: 'Copy' },
  { fullTitle: 'Content - Content Strategist', division: 'Creative Services', department: 'Creative Services', role: 'Content Strategist', rackRate: 200, abbreviation: 'Content' },
  { fullTitle: 'Development - SA - .NET', division: 'Technology', department: 'Technology', role: 'Solutions Architect (.NET)', rackRate: 200, abbreviation: 'SA-.NET' },
  { fullTitle: 'Development - BED - .NET', division: 'Technology', department: 'Technology', role: 'Backend Engineer (.NET)', rackRate: 200, abbreviation: 'BED-.NET' },
  { fullTitle: 'Development - SA - Node', division: 'Technology', department: 'Technology', role: 'Solutions Architect (Node)', rackRate: 200, abbreviation: 'SA-Node' },
  { fullTitle: 'Development - FSD - Node', division: 'Technology', department: 'Technology', role: 'Full Stack Developer (Node)', rackRate: 200, abbreviation: 'FSD-Node' },
  { fullTitle: 'Infrastructure - Infrastructure Engineer', division: 'Technology', department: 'Technology', role: 'Infrastructure Engineer', rackRate: 200, abbreviation: 'Infra' },
  { fullTitle: 'Development - Tech Lead', division: 'Technology', department: 'Technology', role: 'Tech Lead', rackRate: 285, abbreviation: 'TL' },
  { fullTitle: 'Strategy - Lead Strategist', division: 'Marketing', department: 'Marketing', role: 'Lead Strategist', rackRate: 300, abbreviation: 'MSL' },
]

async function main() {
  for (const role of laborRoles) {
    await prisma.laborRole.upsert({
      where: { id: role.abbreviation },
      update: role,
      create: role,
    })
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
