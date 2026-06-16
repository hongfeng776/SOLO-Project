const { Member, User } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');

class MemberService {
  async getMemberList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const search = parseSearch(query, ['member_no']);

    const where = { ...search };

    if (query.memberLevel !== undefined) where.member_level = query.memberLevel;
    if (query.memberStatus !== undefined) where.member_status = query.memberStatus;

    if (query.keyword) {
      const keyword = query.keyword.trim();
      const userWhere = {
        [Op.or]: [
          { username: { [Op.like]: `%${keyword}%` } },
          { real_name: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } },
          { phone: { [Op.like]: `%${keyword}%` } },
        ],
      };
      const users = await User.findAll({ where: userWhere, attributes: ['id'] });
      const userIds = users.map((u) => u.id);
      where.user_id = { [Op.in]: userIds.length > 0 ? userIds : [0] };
      delete where[Op.or];
    }

    const { count, rows } = await Member.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'real_name', 'avatar', 'phone', 'email'] }],
      offset,
      limit: pageSize,
      order,
    });

    return {
      list: rows.map((member) => ({
        id: member.id,
        userId: member.user_id,
        memberNo: member.member_no,
        memberLevel: member.member_level,
        memberStatus: member.member_status,
        startDate: member.start_date,
        expireDate: member.expire_date,
        autoRenew: member.auto_renew,
        balance: member.balance,
        totalSpent: member.total_spent,
        points: member.points,
        currentPlan: member.current_plan,
        lastActiveAt: member.last_active_at,
        createdAt: member.created_at,
        user: member.user ? {
          id: member.user.id,
          username: member.user.username,
          realName: member.user.real_name,
          avatar: member.user.avatar,
          phone: member.user.phone,
          email: member.user.email,
        } : null,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  async getMemberById(id) {
    const member = await Member.findByPk(id, {
      include: [{ model: User, as: 'user' }],
    });
    if (!member) {
      throw new NotFoundError('会员不存在');
    }
    return {
      id: member.id,
      userId: member.user_id,
      memberNo: member.member_no,
      memberLevel: member.member_level,
      memberStatus: member.member_status,
      startDate: member.start_date,
      expireDate: member.expire_date,
      autoRenew: member.auto_renew,
      balance: member.balance,
      totalSpent: member.total_spent,
      points: member.points,
      totalPoints: member.total_points,
      couponCount: member.coupon_count,
      currentPlan: member.current_plan,
      planPrice: member.plan_price,
      planDuration: member.plan_duration,
      privileges: member.privileges,
      lastActiveAt: member.last_active_at,
      remark: member.remark,
      user: member.user,
    };
  }

  async getMemberByUserId(userId) {
    const member = await Member.findOne({
      where: { user_id: userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'real_name', 'avatar'] }],
    });
    if (!member) {
      throw new NotFoundError('会员信息不存在');
    }
    return {
      id: member.id,
      userId: member.user_id,
      memberNo: member.member_no,
      memberLevel: member.member_level,
      memberStatus: member.member_status,
      startDate: member.start_date,
      expireDate: member.expire_date,
      autoRenew: member.auto_renew,
      balance: member.balance,
      totalSpent: member.total_spent,
      points: member.points,
      totalPoints: member.total_points,
      couponCount: member.coupon_count,
      currentPlan: member.current_plan,
      privileges: member.privileges,
      lastActiveAt: member.last_active_at,
      user: member.user ? {
        id: member.user.id,
        username: member.user.username,
        realName: member.user.real_name,
        avatar: member.user.avatar,
      } : null,
    };
  }

  async createMember(data) {
    const exist = await Member.findOne({ where: { user_id: data.userId } });
    if (exist) {
      throw new ConflictError('该用户已是会员');
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const memberNo = `QY${dateStr}${random}`;

    const member = await Member.create({
      user_id: data.userId,
      member_no: memberNo,
      member_level: data.memberLevel ?? 0,
      member_status: data.memberStatus ?? 1,
      start_date: data.startDate,
      expire_date: data.expireDate,
      auto_renew: data.autoRenew ?? 0,
      balance: data.balance ?? 0,
      total_spent: data.totalSpent ?? 0,
      points: data.points ?? 0,
      total_points: data.totalPoints ?? 0,
      coupon_count: data.couponCount ?? 0,
      current_plan: data.currentPlan,
      plan_price: data.planPrice ?? 0,
      plan_duration: data.planDuration ?? 0,
      privileges: data.privileges || [],
      remark: data.remark,
    });
    return member.id;
  }

  async updateMember(id, data) {
    const member = await Member.findByPk(id);
    if (!member) {
      throw new NotFoundError('会员不存在');
    }

    const updateData = {};
    if (data.memberLevel !== undefined) updateData.member_level = data.memberLevel;
    if (data.memberStatus !== undefined) updateData.member_status = data.memberStatus;
    if (data.autoRenew !== undefined) updateData.auto_renew = data.autoRenew;
    if (data.balance !== undefined) updateData.balance = data.balance;
    if (data.points !== undefined) updateData.points = data.points;
    if (data.couponCount !== undefined) updateData.coupon_count = data.couponCount;
    if (data.privileges !== undefined) updateData.privileges = data.privileges;
    if (data.remark !== undefined) updateData.remark = data.remark;

    await Member.update(updateData, { where: { id } });
    return true;
  }

  async renewMember(id, data) {
    const member = await Member.findByPk(id);
    if (!member) {
      throw new NotFoundError('会员不存在');
    }

    const currentExpire = member.expire_date ? new Date(member.expire_date) : new Date();
    const baseDate = currentExpire > new Date() ? currentExpire : new Date();
    const newExpireDate = new Date(baseDate.getTime() + (data.duration || 0) * 24 * 60 * 60 * 1000);

    await Member.update({
      expire_date: newExpireDate,
      balance: data.balance !== undefined ? data.balance : member.balance,
      total_spent: data.totalSpent !== undefined ? data.totalSpent : member.total_spent,
      current_plan: data.currentPlan || member.current_plan,
      plan_price: data.planPrice !== undefined ? data.planPrice : member.plan_price,
      plan_duration: data.duration || member.plan_duration,
      member_status: 1,
    }, { where: { id } });
    return true;
  }

  async upgradeMember(id, newLevel, planData) {
    const member = await Member.findByPk(id);
    if (!member) {
      throw new NotFoundError('会员不存在');
    }
    if (newLevel <= member.member_level) {
      throw new BadRequestError('只能升级到更高级别');
    }

    await Member.update({
      member_level: newLevel,
      current_plan: planData.currentPlan || member.current_plan,
      plan_price: planData.planPrice !== undefined ? planData.planPrice : member.plan_price,
      plan_duration: planData.duration !== undefined ? planData.duration : member.plan_duration,
      privileges: planData.privileges || member.privileges,
    }, { where: { id } });
    return true;
  }

  async freezeMember(id) {
    const member = await Member.findByPk(id);
    if (!member) {
      throw new NotFoundError('会员不存在');
    }
    if (member.member_status === 2) {
      throw new BadRequestError('会员已被冻结');
    }
    await Member.update({ member_status: 2 }, { where: { id } });
    return true;
  }

  async unfreezeMember(id) {
    const member = await Member.findByPk(id);
    if (!member) {
      throw new NotFoundError('会员不存在');
    }
    if (member.member_status !== 2) {
      throw new BadRequestError('会员未被冻结');
    }
    const newStatus = member.expire_date && new Date(member.expire_date) > new Date() ? 1 : 0;
    await Member.update({ member_status: newStatus }, { where: { id } });
    return true;
  }

  async getMemberStats() {
    const levelStats = await Member.findAll({
      attributes: ['member_level', [require('../config/database').sequelize.fn('COUNT', '*'), 'count']],
      group: ['member_level'],
      raw: true,
    });

    const totalSpentResult = await Member.findOne({
      attributes: [[require('../config/database').sequelize.fn('SUM', require('../config/database').sequelize.col('total_spent')), 'totalSpent']],
      raw: true,
    });

    const totalPointsResult = await Member.findOne({
      attributes: [[require('../config/database').sequelize.fn('SUM', require('../config/database').sequelize.col('total_points')), 'totalPoints']],
      raw: true,
    });

    const levelMap = {};
    for (const item of levelStats) {
      levelMap[item.member_level] = Number(item.count);
    }

    return {
      levelStats: levelMap,
      totalSpent: Number(totalSpentResult?.totalSpent || 0),
      totalPoints: Number(totalPointsResult?.totalPoints || 0),
    };
  }
}

module.exports = new MemberService();
