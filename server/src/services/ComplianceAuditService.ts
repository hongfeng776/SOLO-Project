import { Op } from 'sequelize';
import complianceAuditDAO from '@dao/ComplianceAuditDAO';
import { db } from '@models/index';
import { AppError } from '@middlewares/errorHandler';

function generateAuditNo(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CA${dateStr}${random}`;
}

class ComplianceAuditService {
  async getAuditById(id: number) {
    const audit = await db.ComplianceAudit.findByPk(id);
    if (!audit) {
      throw new AppError(404, 'Compliance audit not found');
    }
    return audit;
  }

  async getAuditList(params: { page: number; pageSize: number; auditType?: string; auditStatus?: string; targetType?: string; keyword?: string }) {
    const { page, pageSize, auditType, auditStatus, targetType, keyword } = params;
    const where: any = {};

    if (auditType) {
      where.audit_type = auditType;
    }

    if (auditStatus) {
      where.audit_status = auditStatus;
    }

    if (targetType) {
      where.target_type = targetType;
    }

    if (keyword) {
      where.audit_no = { [Op.like]: `%${keyword}%` };
    }

    const { rows, count } = await db.ComplianceAudit.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    return { list: rows, total: count, page, pageSize };
  }

  async getAuditByNo(auditNo: string) {
    const audit = await complianceAuditDAO.findByAuditNo(auditNo);
    if (!audit) {
      throw new AppError(404, 'Compliance audit not found');
    }
    return audit;
  }

  async createAudit(data: any) {
    const audit_no = generateAuditNo();
    return db.ComplianceAudit.create({ ...data, audit_no, audit_status: data.audit_status || 'pending' });
  }

  async approveAudit(id: number, auditorId: number, opinion: string) {
    const audit = await db.ComplianceAudit.findByPk(id);
    if (!audit) {
      throw new AppError(404, 'Compliance audit not found');
    }
    await db.ComplianceAudit.update(
      { audit_status: 'approved', auditor_id: auditorId, audit_opinion: opinion, audit_at: new Date() },
      { where: { id } },
    );
    return db.ComplianceAudit.findByPk(id);
  }

  async rejectAudit(id: number, auditorId: number, opinion: string) {
    const audit = await db.ComplianceAudit.findByPk(id);
    if (!audit) {
      throw new AppError(404, 'Compliance audit not found');
    }
    await db.ComplianceAudit.update(
      { audit_status: 'rejected', auditor_id: auditorId, audit_opinion: opinion, audit_at: new Date() },
      { where: { id } },
    );
    return db.ComplianceAudit.findByPk(id);
  }

  async updateAudit(id: number, data: any) {
    const audit = await db.ComplianceAudit.findByPk(id);
    if (!audit) {
      throw new AppError(404, 'Compliance audit not found');
    }
    await db.ComplianceAudit.update(data, { where: { id } });
    return db.ComplianceAudit.findByPk(id);
  }

  async deleteAudit(id: number) {
    const audit = await db.ComplianceAudit.findByPk(id);
    if (!audit) {
      throw new AppError(404, 'Compliance audit not found');
    }
    await db.ComplianceAudit.destroy({ where: { id } });
  }
}

export default new ComplianceAuditService();
