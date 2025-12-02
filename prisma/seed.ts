import { PrismaClient, Role, LessonType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create Instance
    const instance = await prisma.instance.upsert({
        where: { slug: 'default-instance' },
        update: {},
        create: {
            name: 'Default Instance',
            slug: 'default-instance',
            themeColor: '#4F46E5',
        },
    });
    console.log({ instance });

    // 2. Create Users
    const password = await argon2.hash('password123');

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password,
            firstName: 'Admin',
            lastName: 'User',
            role: Role.ADMIN,
            isEmailConfirmed: true,
        },
    });
    console.log({ admin });

    const instructor = await prisma.user.upsert({
        where: { email: 'instructor@example.com' },
        update: {},
        create: {
            email: 'instructor@example.com',
            password,
            firstName: 'John',
            lastName: 'Doe',
            role: Role.INSTRUCTOR,
            isEmailConfirmed: true,
            bio: 'Expert instructor with 10 years of experience.',
        },
    });
    console.log({ instructor });

    // 3. Create Category
    const category = await prisma.category.upsert({
        where: { slug: 'web-development' },
        update: {},
        create: {
            name: 'Web Development',
            slug: 'web-development',
        },
    });
    console.log({ category });

    // 4. Create Course
    const course = await prisma.course.upsert({
        where: { slug: 'intro-to-nestjs' },
        update: {},
        create: {
            title: 'Introduction to NestJS',
            slug: 'intro-to-nestjs',
            description: 'Learn the basics of NestJS framework.',
            instructorId: instructor.id,
            categoryId: category.id,
            learningGoals: ['Understand NestJS modules', 'Build REST APIs'],
            requirements: ['Basic JavaScript knowledge'],
            audience: ['Beginner developers'],
            price: 'Free',
        },
    });
    console.log({ course });

    // 5. Create Sections and Lessons
    const videoUrl = 'https://triunfars-bucket.s3.us-east-2.amazonaws.com/video1.mp4';

    // Section 1: Getting Started
    const section1 = await prisma.section.upsert({
        where: { slug: 'getting-started' },
        update: {},
        create: {
            title: 'Getting Started',
            slug: 'getting-started',
            courseId: course.id,
        },
    });
    console.log({ section1 });

    await prisma.lesson.create({
        data: {
            title: 'What is NestJS?',
            slug: 'what-is-nestjs',
            description: 'An introduction to the NestJS framework and its core concepts.',
            content: 'NestJS is a progressive Node.js framework for building efficient, reliable and scalable server-side applications.',
            type: LessonType.VIDEO,
            url: videoUrl,
            sectionId: section1.id,
        },
    });

    await prisma.lesson.create({
        data: {
            title: 'Setting Up Your Environment',
            slug: 'setting-up-environment',
            description: 'Learn how to set up your development environment for NestJS.',
            content: 'In this lesson, we will install Node.js, npm, and create our first NestJS project.',
            type: LessonType.VIDEO,
            url: videoUrl,
            sectionId: section1.id,
        },
    });

    // Section 2: Core Concepts
    const section2 = await prisma.section.upsert({
        where: { slug: 'core-concepts' },
        update: {},
        create: {
            title: 'Core Concepts',
            slug: 'core-concepts',
            courseId: course.id,
        },
    });
    console.log({ section2 });

    await prisma.lesson.create({
        data: {
            title: 'Controllers and Routing',
            slug: 'controllers-and-routing',
            description: 'Understanding controllers and how routing works in NestJS.',
            content: 'Controllers are responsible for handling incoming requests and returning responses to the client.',
            type: LessonType.VIDEO,
            url: videoUrl,
            sectionId: section2.id,
        },
    });

    await prisma.lesson.create({
        data: {
            title: 'Services and Dependency Injection',
            slug: 'services-and-dependency-injection',
            description: 'Learn about services and the powerful dependency injection system.',
            content: 'Services contain business logic and can be injected into controllers and other services.',
            type: LessonType.VIDEO,
            url: videoUrl,
            sectionId: section2.id,
        },
    });

    // Section 3: Building APIs
    const section3 = await prisma.section.upsert({
        where: { slug: 'building-apis' },
        update: {},
        create: {
            title: 'Building APIs',
            slug: 'building-apis',
            courseId: course.id,
        },
    });
    console.log({ section3 });

    await prisma.lesson.create({
        data: {
            title: 'Creating REST Endpoints',
            slug: 'creating-rest-endpoints',
            description: 'Build your first REST API endpoints with NestJS.',
            content: 'Learn how to create GET, POST, PUT, and DELETE endpoints for your API.',
            type: LessonType.VIDEO,
            url: videoUrl,
            sectionId: section3.id,
        },
    });

    await prisma.lesson.create({
        data: {
            title: 'Data Validation and DTOs',
            slug: 'data-validation-and-dtos',
            description: 'Implement data validation using DTOs and class-validator.',
            content: 'DTOs (Data Transfer Objects) help us validate and transform incoming data.',
            type: LessonType.VIDEO,
            url: videoUrl,
            sectionId: section3.id,
        },
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
