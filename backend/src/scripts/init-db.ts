import sequelize from '../config/database';
import { User } from '../models';
import { UserRole } from '../constants/recruitment.enum';

const initDatabase = async () => {
  try {
    console.log('Syncing database...');
    await sequelize.sync({ force: true });
    console.log('Database synced!');

    console.log('Creating default admin user...');
    await User.create({
      username: 'admin',
      password: '123456',
      realName: '超级管理员',
      email: 'admin@youcai.com',
      phone: '13800138000',
      role: UserRole.ADMIN,
      status: 1,
    });

    await User.create({
      username: 'hr001',
      password: '123456',
      realName: 'HR专员',
      email: 'hr@youcai.com',
      phone: '13800138001',
      role: UserRole.HR,
      status: 1,
    });

    console.log('Default users created!');
    console.log('Admin: admin / 123456');
    console.log('HR: hr001 / 123456');

    process.exit(0);
  } catch (error) {
    console.error('Init database failed:', error);
    process.exit(1);
  }
};

initDatabase();
