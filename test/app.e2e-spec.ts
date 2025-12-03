
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { SignUpDto } from '../src/auth/dto';

describe('App e2e', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
            }),
        );
        await app.init();
        await app.listen(3333);

        prisma = app.get(PrismaService);
        await prisma.cleanDb();
        pactum.request.setBaseUrl('http://localhost:3333');
    }, 30000);

    afterAll(() => {
        app.close();
    });

    describe('Auth', () => {
        const dto: SignUpDto = {
            email: 'test@gmail.com',
            password: '123',
            firstName: 'Test',
            lastName: 'User',
            role: 'STUDENT' as any,
        };

        describe('Signup', () => {
            it('should throw if email empty', () => {
                return pactum
                    .spec()
                    .post('/auth/signup')
                    .withBody({
                        password: dto.password,
                    })
                    .expectStatus(400);
            });

            it('should signup', () => {
                return pactum
                    .spec()
                    .post('/auth/signup')
                    .withBody(dto)
                    .expectStatus(201);
            });
        });

        describe('Signin', () => {
            it('should throw if email empty', () => {
                return pactum
                    .spec()
                    .post('/auth/signin')
                    .withBody({
                        password: dto.password,
                    })
                    .expectStatus(400);
            });

            it('should signin', () => {
                return pactum
                    .spec()
                    .post('/auth/signin')
                    .withBody({
                        email: dto.email,
                        password: dto.password,
                    })
                    .expectStatus(200)
                    .stores('userToken', 'token');
            });
        });
    });

    describe('User', () => {
        describe('Get me', () => {
            it('should get current user', () => {
                return pactum
                    .spec()
                    .get('/users/me')
                    .withHeaders({
                        Authorization: 'Bearer $S{userToken}',
                    })
                    .expectStatus(200)
                    .stores('userId', 'id');
            });
        });
    });


    describe('Course Management', () => {
        // Create Admin
        it('should create admin user', () => {
            return pactum
                .spec()
                .post('/auth/signup')
                .withBody({
                    email: 'admin@test.com',
                    password: '123',
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'ADMIN',
                })
                .expectStatus(201)
                .stores('adminId', 'id');
        });

        it('should signin as admin', () => {
            return pactum
                .spec()
                .post('/auth/signin')
                .withBody({
                    email: 'admin@test.com',
                    password: '123',
                })
                .expectStatus(200)
                .stores('adminToken', 'token');
        });

        it('should get admin profile', () => {
            return pactum
                .spec()
                .get('/users/me')
                .withHeaders({ Authorization: 'Bearer $S{adminToken}' })
                .expectStatus(200)
                .expectJsonLike({
                    role: 'ADMIN',
                })
                .stores('adminId', 'id');
        });

        it('should create category', () => {
            return pactum
                .spec()
                .post('/categories')
                .withHeaders({ Authorization: 'Bearer $S{adminToken}' })
                .withBody({
                    name: 'Test Category',
                })
                .expectStatus(201)
                .stores('categoryId', 'id');
        });

        it('should create course', () => {
            return pactum
                .spec()
                .post('/courses')
                .withHeaders({ Authorization: 'Bearer $S{adminToken}' })
                .withBody({
                    title: 'Test Course',
                    description: 'Test Description',
                    categoryId: '$S{categoryId}',
                    learningGoals: ['Goal 1'],
                    requirements: ['Req 1'],
                    audience: ['Audience 1'],
                    instructorId: '$S{adminId}',
                    price: '10.00',
                })
                .expectStatus(201)
                .stores('courseId', 'id');
        });

        it('should create section', () => {
            return pactum
                .spec()
                .post('/courses/test-course/sections')
                .withHeaders({ Authorization: 'Bearer $S{adminToken}' })
                .withBody({
                    title: 'Test Section',
                })
                .expectStatus(201)
                .stores('sectionId', 'id');
        });

        it('should create lesson', () => {
            return pactum
                .spec()
                .post('/courses/test-course/sections/test-section/lessons')
                .withHeaders({ Authorization: 'Bearer $S{adminToken}' })
                .withBody({
                    title: 'Test Lesson',
                    content: 'Test Content',
                    description: 'Test Description',
                    type: 'VIDEO',
                    url: 'http://video.url',
                })
                .expectStatus(201)
                .stores('lessonId', 'id');
        });
    });

    describe('Enrollment', () => {
        // Create Student
        it('should create student user', () => {
            return pactum
                .spec()
                .post('/auth/signup')
                .withBody({
                    email: 'student@test.com',
                    password: '123',
                    firstName: 'Student',
                    lastName: 'User',
                    role: 'STUDENT',
                })
                .expectStatus(201);
        });

        it('should signin as student', () => {
            return pactum
                .spec()
                .post('/auth/signin')
                .withBody({
                    email: 'student@test.com',
                    password: '123',
                })
                .expectStatus(200)
                .stores('studentToken', 'token');
        });

        it('should enroll in course', () => {
            return pactum
                .spec()
                .post('/courses/$S{courseId}/enroll')
                .withHeaders({ Authorization: 'Bearer $S{studentToken}' })
                .expectStatus(201);
        });

        it('should get enrolled courses with sections', () => {
            return pactum
                .spec()
                .get('/courses/user/enrolled')
                .withHeaders({ Authorization: 'Bearer $S{studentToken}' })
                .expectStatus(200)
                .expectJsonLike([
                    {
                        id: '$S{courseId}',
                        sections: [
                            {
                                id: '$S{sectionId}',
                                lessons: [
                                    {
                                        id: '$S{lessonId}',
                                    },
                                ],
                            },
                        ],
                    },
                ]);
        });

        it('should unenroll from course', () => {
            return pactum
                .spec()
                .delete('/courses/$S{courseId}/enroll')
                .withHeaders({ Authorization: 'Bearer $S{studentToken}' })
                .expectStatus(200);
        });
    });

    describe('Payment (RevenueCat)', () => {
        it('should handle webhook and update user status', () => {
            return pactum
                .spec()
                .post('/payments/webhook')
                .withHeaders({ Authorization: 'Bearer test_webhook_secret' })
                .withBody({
                    event: {
                        type: 'INITIAL_PURCHASE',
                        app_user_id: '$S{userId}', // Using the user ID from Get Me
                        purchased_at_ms: Date.now(),
                        expiration_at_ms: Date.now() + 1000000,
                        product_id: 'monthly_subscription',
                    },
                })
                .expectStatus(200);
        });

        it('should verify user is premium', () => {
            return pactum
                .spec()
                .get('/users/me')
                .withHeaders({ Authorization: 'Bearer $S{userToken}' }) // Token from Auth suite
                .expectStatus(200)
                .expectJsonLike({
                    isPremium: true,
                    subscriptionStatus: 'active',
                });
        });
    });
});

