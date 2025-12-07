import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CourseAccessGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const params = request.params;
        const courseSlug = params.courseSlug;

        if (!user) {
            throw new ForbiddenException('User not found');
        }

        // 1. Allow Admins and Instructors
        if (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') {
            return true;
        }

        // 2. Allow Premium Users
        if (user.isPremium) {
            return true;
        }

        // 3. Check Course Enrollment
        if (!courseSlug) {
            // If no courseSlug in params, we can't check specific enrollment here.
            // Depending on the route, this might be okay or an error.
            // For now, let's assume if it's used, courseSlug is expected.
            return true;
        }

        // We need the Course ID to check against enrolledCourseIds
        // Optimization: We could cache this mapping or store slugs in user, 
        // but for now a DB call is safest.
        const course = await this.prisma.course.findUnique({
            where: { slug: courseSlug },
            select: { id: true },
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        if (user.enrolledCourseIds.includes(course.id)) {
            return true;
        }

        throw new ForbiddenException('You do not have access to this course');
    }
}
