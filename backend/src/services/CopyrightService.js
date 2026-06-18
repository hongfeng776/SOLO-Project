const { Copyright, Content } = require('../models');
const { Op } = require('../config/database');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');
const { parsePagination, parseSort, parseSearch } = require('../utils/helpers');

class CopyrightService {
  _calculateComplianceStatus(copyright) {
    const now = new Date();
    const endDate = new Date(copyright.end_date || copyright.endDate);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const hasAllFiles = copyright.copyright_certificate && copyright.authorization_agreement && copyright.ownership_proof;
    if (!hasAllFiles) return 4;

    if (endDate < now) return 3;
    if (endDate < thirtyDaysLater) return 2;
    return 1;
  }

  _mapCopyright(item) {
    return {
      id: item.id,
      code: item.copyright_code,
      name: item.copyright_name,
      type: item.copyright_type,
      contentType: item.content_type,
      supplierName: item.supplier_name,
      supplierContact: item.supplier_contact,
      supplierPhone: item.supplier_phone,
      contractNo: item.contract_no,
      contractFile: item.contract_file,
      authorizationFile: item.authorization_file,
      copyrightCertificate: item.copyright_certificate,
      authorizationAgreement: item.authorization_agreement,
      ownershipProof: item.ownership_proof,
      startDate: item.start_date,
      endDate: item.end_date,
      territories: item.territories,
      licenseScope: item.license_scope,
      licenseFee: item.license_fee,
      currency: item.currency,
      paymentStatus: item.payment_status,
      contentCount: item.content_count,
      ownershipStatus: item.ownership_status,
      complianceStatus: item.compliance_status,
      bindStatus: item.bind_status,
      description: item.copyright_description,
      attachments: item.attachments,
      qualificationFiles: item.qualification_files,
      status: item.status,
      remark: item.remark,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  async getCopyrightList(query) {
    const { page, pageSize, offset } = parsePagination(query);
    const order = parseSort(query);
    const search = parseSearch(query, ['copyright_code', 'copyright_name', 'supplier_name', 'contract_no']);

    const where = { ...search };

    if (query.type) where.copyright_type = query.type;
    if (query.contentType) where.content_type = query.contentType;
    if (query.status !== undefined && query.status !== null && query.status !== '') where.status = query.status;
    if (query.ownershipStatus) where.ownership_status = query.ownershipStatus;
    if (query.complianceStatus) where.compliance_status = query.complianceStatus;
    if (query.bindStatus) where.bind_status = query.bindStatus;

    const { count, rows } = await Copyright.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order,
    });

    return {
      list: rows.map((item) => this._mapCopyright(item)),
      pagination: {
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      },
    };
  }

  async getCopyrightById(id) {
    const copyright = await Copyright.findByPk(id, {
      include: [{ model: Content, as: 'contents', limit: 50, attributes: ['id', 'content_title', 'category', 'status', 'audit_status'] }],
    });
    if (!copyright) {
      throw new NotFoundError('版权信息不存在');
    }
    const result = this._mapCopyright(copyright);
    result.relatedContents = (copyright.contents || []).map((c) => ({
      id: c.id,
      title: c.content_title,
      category: c.category,
      status: c.status,
      auditStatus: c.audit_status,
    }));
    return result;
  }

  async checkConflict(data, excludeId = null) {
    const conflicts = [];

    if (data.code) {
      const where = { copyright_code: data.code };
      if (excludeId) where.id = { [Op.ne]: excludeId };
      const exist = await Copyright.findOne({ where });
      if (exist) {
        conflicts.push({
          type: 'duplicate_code',
          level: 'high',
          message: `版权编号 ${data.code} 已存在`,
          relatedCopyrightId: exist.id,
          relatedCopyrightCode: exist.copyright_code,
        });
      }
    }

    if (data.contentIds && data.contentIds.length > 0) {
      const boundContents = await Content.findAll({
        where: {
          id: { [Op.in]: data.contentIds },
          copyright_id: { [Op.ne]: null, [Op.ne]: excludeId || 0 },
        },
        attributes: ['id', 'content_title', 'copyright_id'],
      });
      for (const content of boundContents) {
        const boundCopyright = await Copyright.findByPk(content.copyright_id, {
          attributes: ['id', 'copyright_code'],
        });
        if (boundCopyright) {
          conflicts.push({
            type: 'content_conflict',
            level: 'high',
            message: `内容 "${content.content_title}" 已绑定版权编号 ${boundCopyright.copyright_code}，存在冲突`,
            relatedCopyrightId: boundCopyright.id,
            relatedCopyrightCode: boundCopyright.copyright_code,
            relatedContentId: content.id,
            relatedContentTitle: content.content_title,
          });
        }
      }
    }

    const hasHighConflict = conflicts.some((c) => c.level === 'high');
    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      canSubmit: !hasHighConflict,
    };
  }

  async verifyQualificationFiles(data) {
    const issues = [];
    const fileChecks = [];

    const certificateFile = data.copyrightCertificate || data.qualificationFiles?.find((f) => f.type === 'certificate');
    const agreementFile = data.authorizationAgreement || data.qualificationFiles?.find((f) => f.type === 'agreement');
    const ownershipFile = data.ownershipProof || data.qualificationFiles?.find((f) => f.type === 'ownership');

    if (!certificateFile) {
      issues.push({ field: 'copyrightCertificate', level: 'error', message: '缺少版权证书文件' });
    } else {
      fileChecks.push({
        fileType: 'certificate',
        fileName: typeof certificateFile === 'string' ? '版权证书' : certificateFile.name,
        isValid: true,
        ocrResult: { validityDate: data.endDate },
        issues: [],
      });
    }

    if (!agreementFile) {
      issues.push({ field: 'authorizationAgreement', level: 'error', message: '缺少授权协议文件' });
    } else {
      fileChecks.push({
        fileType: 'agreement',
        fileName: typeof agreementFile === 'string' ? '授权协议' : agreementFile.name,
        isValid: true,
        issues: [],
      });
    }

    if (!ownershipFile) {
      issues.push({ field: 'ownershipProof', level: 'error', message: '缺少权属证明文件' });
    } else {
      fileChecks.push({
        fileType: 'ownership',
        fileName: typeof ownershipFile === 'string' ? '权属证明' : ownershipFile.name,
        isValid: true,
        issues: [],
      });
    }

    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (end <= start) {
        issues.push({ field: 'endDate', level: 'error', message: '授权结束日期必须晚于开始日期' });
      }
      const now = new Date();
      if (end < now) {
        issues.push({ field: 'endDate', level: 'error', message: '版权有效期已过期' });
      } else {
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (end < thirtyDaysLater) {
          issues.push({ field: 'endDate', level: 'warning', message: '版权即将在30天内过期，请注意续期' });
        }
      }
    }

    return {
      isValid: !issues.some((i) => i.level === 'error'),
      issues,
      fileChecks,
    };
  }

  async createCopyright(data, operatorId) {
    const conflictResult = await this.checkConflict(data);
    if (!conflictResult.canSubmit) {
      throw new ConflictError(conflictResult.conflicts[0].message);
    }

    const verifyResult = await this.verifyQualificationFiles(data);
    if (!verifyResult.isValid) {
      const errorIssue = verifyResult.issues.find((i) => i.level === 'error');
      throw new BadRequestError(errorIssue?.message || '资质文件校验失败');
    }

    const complianceStatus = this._calculateComplianceStatus({
      end_date: data.endDate,
      copyright_certificate: data.copyrightCertificate,
      authorization_agreement: data.authorizationAgreement,
      ownership_proof: data.ownershipProof,
    });

    const copyright = await Copyright.create({
      copyright_code: data.code,
      copyright_name: data.name,
      copyright_type: data.type,
      content_type: data.contentType,
      supplier_name: data.supplierName,
      supplier_contact: data.supplierContact,
      supplier_phone: data.supplierPhone,
      contract_no: data.contractNo,
      contract_file: data.contractFile,
      authorization_file: data.authorizationFile,
      copyright_certificate: data.copyrightCertificate,
      authorization_agreement: data.authorizationAgreement,
      ownership_proof: data.ownershipProof,
      start_date: data.startDate,
      end_date: data.endDate,
      territories: data.territories,
      license_scope: data.licenseScope,
      license_fee: data.licenseFee,
      currency: data.currency,
      payment_status: data.paymentStatus ?? 0,
      ownership_status: data.ownershipStatus ?? 1,
      compliance_status: complianceStatus,
      bind_status: (data.contentIds && data.contentIds.length > 0) ? 1 : 0,
      copyright_description: data.description,
      attachments: data.attachments,
      qualification_files: data.qualificationFiles,
      status: data.status ?? 1,
      remark: data.remark,
      created_by: operatorId,
    });

    if (data.contentIds && data.contentIds.length > 0) {
      await Content.update(
        { copyright_id: copyright.id },
        { where: { id: { [Op.in]: data.contentIds } } }
      );
      await copyright.update({ content_count: data.contentIds.length, bind_status: 1 });
    }

    return copyright.id;
  }

  async updateCopyright(id, data, operatorId) {
    const copyright = await Copyright.findByPk(id);
    if (!copyright) {
      throw new NotFoundError('版权信息不存在');
    }

    const conflictResult = await this.checkConflict(data, id);
    if (!conflictResult.canSubmit) {
      throw new ConflictError(conflictResult.conflicts[0].message);
    }

    const updateData = {
      copyright_code: data.code,
      copyright_name: data.name,
      copyright_type: data.type,
      content_type: data.contentType,
      supplier_name: data.supplierName,
      supplier_contact: data.supplierContact,
      supplier_phone: data.supplierPhone,
      contract_no: data.contractNo,
      contract_file: data.contractFile,
      authorization_file: data.authorizationFile,
      start_date: data.startDate,
      end_date: data.endDate,
      territories: data.territories,
      license_fee: data.licenseFee,
      currency: data.currency,
      payment_status: data.paymentStatus,
      ownership_status: data.ownershipStatus,
      copyright_description: data.description,
      attachments: data.attachments,
      status: data.status,
      remark: data.remark,
      updated_by: operatorId,
    };

    if (data.copyrightCertificate !== undefined) updateData.copyright_certificate = data.copyrightCertificate;
    if (data.authorizationAgreement !== undefined) updateData.authorization_agreement = data.authorizationAgreement;
    if (data.ownershipProof !== undefined) updateData.ownership_proof = data.ownershipProof;
    if (data.licenseScope !== undefined) updateData.license_scope = data.licenseScope;
    if (data.qualificationFiles !== undefined) updateData.qualification_files = data.qualificationFiles;

    const mergedData = {
      ...copyright.toJSON(),
      ...Object.fromEntries(Object.entries(updateData).map(([k, v]) => [k, v])),
      end_date: updateData.end_date || copyright.end_date,
      copyright_certificate: updateData.copyright_certificate ?? copyright.copyright_certificate,
      authorization_agreement: updateData.authorization_agreement ?? copyright.authorization_agreement,
      ownership_proof: updateData.ownership_proof ?? copyright.ownership_proof,
    };
    updateData.compliance_status = this._calculateComplianceStatus(mergedData);

    await Copyright.update(updateData, { where: { id } });

    if (data.contentIds) {
      await Content.update({ copyright_id: null }, { where: { copyright_id: id } });
      if (data.contentIds.length > 0) {
        await Content.update(
          { copyright_id: id },
          { where: { id: { [Op.in]: data.contentIds } } }
        );
        await Copyright.update(
          { content_count: data.contentIds.length, bind_status: 1 },
          { where: { id } }
        );
      } else {
        await Copyright.update({ content_count: 0, bind_status: 0 }, { where: { id } });
      }
    }

    return true;
  }

  async deleteCopyright(id) {
    const copyright = await Copyright.findByPk(id);
    if (!copyright) {
      throw new NotFoundError('版权信息不存在');
    }
    const contentCount = await Content.count({ where: { copyright_id: id } });
    if (contentCount > 0) {
      throw new BadRequestError('该版权下存在关联内容，无法删除');
    }
    await copyright.destroy();
    return true;
  }

  async batchImport(rows, operatorId) {
    const result = {
      batchId: 'BATCH_' + Date.now(),
      total: rows.length,
      successCount: 0,
      skippedCount: 0,
      errorCount: 0,
      rows: [],
      generatedAt: new Date().toISOString(),
      exceptionReport: {
        formatErrors: [],
        missingFields: [],
        duplicateCodes: [],
      },
    };

    const requiredFields = ['code', 'name', 'type', 'supplierName', 'startDate', 'endDate'];
    const seenCodes = new Set();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowResult = {
        rowIndex: i + 1,
        data: row,
        status: 'pending' as const,
        errorMessages: [] as string[],
        warnings: [] as string[],
      };

      const missing = requiredFields.filter((f) => !row[f] && row[f] !== 0);
      if (missing.length > 0) {
        rowResult.status = 'error';
        rowResult.errorMessages.push(`缺少必填字段: ${missing.join(', ')}`);
        result.exceptionReport.missingFields.push(rowResult);
      }

      if (!/^[A-Za-z0-9_-]{1,50}$/.test(row.code || '')) {
        rowResult.status = 'error';
        rowResult.errorMessages.push('版权编号格式错误，仅支持字母、数字、下划线、短横线，长度1-50');
        result.exceptionReport.formatErrors.push(rowResult);
      }

      if (seenCodes.has(row.code)) {
        rowResult.status = rowResult.status === 'pending' ? 'error' : rowResult.status;
        rowResult.errorMessages.push(`批次内重复的版权编号: ${row.code}`);
        result.exceptionReport.duplicateCodes.push(rowResult);
      }
      seenCodes.add(row.code);

      if (row.startDate && row.endDate) {
        try {
          const start = new Date(row.startDate);
          const end = new Date(row.endDate);
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            rowResult.status = rowResult.status === 'pending' ? 'error' : rowResult.status;
            rowResult.errorMessages.push('日期格式错误');
            result.exceptionReport.formatErrors.push(rowResult);
          } else if (end <= start) {
            rowResult.warnings.push('结束日期早于或等于开始日期，数据已自动跳过');
            rowResult.status = 'skipped';
          }
        } catch {
          rowResult.status = 'error';
          rowResult.errorMessages.push('日期解析失败');
          result.exceptionReport.formatErrors.push(rowResult);
        }
      }

      if (rowResult.status === 'pending') {
        try {
          const id = await this.createCopyright(row, operatorId);
          rowResult.copyrightId = id;
          rowResult.status = 'success';
          result.successCount++;
        } catch (err: any) {
          rowResult.status = 'error';
          rowResult.errorMessages.push(err.message || '创建失败');
          if (err.message?.includes('已存在')) {
            result.exceptionReport.duplicateCodes.push(rowResult);
          }
          result.errorCount++;
        }
      } else if (rowResult.status === 'skipped') {
        result.skippedCount++;
      } else if (rowResult.status === 'error') {
        result.errorCount++;
      }

      result.rows.push(rowResult);
    }

    return result;
  }

  async batchRenew(params, operatorId) {
    const { ids, extendMonths = 12, extendEndDate, renewalReason, remark } = params;
    const progress = {
      batchId: 'RENEW_' + Date.now(),
      action: 'renew',
      actionLabel: '批量续期',
      total: ids.length,
      processed: 0,
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
      progress: 0,
      status: 'running' as const,
      startedAt: new Date().toISOString(),
    };

    const result = [];

    for (const id of ids) {
      try {
        const copyright = await Copyright.findByPk(id);
        if (!copyright) {
          progress.skippedCount++;
          result.push({ id, status: 'skipped', message: '版权不存在' });
          progress.processed++;
          progress.progress = Math.round((progress.processed / progress.total) * 100);
          continue;
        }

        let newEndDate;
        if (extendEndDate) {
          newEndDate = new Date(extendEndDate);
        } else {
          newEndDate = new Date(copyright.end_date);
          newEndDate.setMonth(newEndDate.getMonth() + extendMonths);
        }

        await copyright.update({
          end_date: newEndDate,
          status: 1,
          compliance_status: 1,
          remark: remark ? `${remark} | 续期原因: ${renewalReason || ''}` : copyright.remark,
          updated_by: operatorId,
        });
        progress.successCount++;
        result.push({ id, status: 'success', newEndDate: newEndDate.toISOString() });
      } catch (err: any) {
        progress.failedCount++;
        result.push({ id, status: 'failed', message: err.message });
      }
      progress.processed++;
      progress.progress = Math.round((progress.processed / progress.total) * 100);
    }

    progress.status = 'completed';
    progress.completedAt = new Date().toISOString();

    return { progress, details: result };
  }

  async batchInvalid(params, operatorId) {
    const { ids, invalidReason, remark } = params;
    const progress = {
      batchId: 'INVALID_' + Date.now(),
      action: 'invalid',
      actionLabel: '批量标记失效',
      total: ids.length,
      processed: 0,
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
      progress: 0,
      status: 'running' as const,
      startedAt: new Date().toISOString(),
    };

    const result = [];

    for (const id of ids) {
      try {
        const copyright = await Copyright.findByPk(id);
        if (!copyright) {
          progress.skippedCount++;
          result.push({ id, status: 'skipped', message: '版权不存在' });
          progress.processed++;
          progress.progress = Math.round((progress.processed / progress.total) * 100);
          continue;
        }

        await copyright.update({
          status: 0,
          compliance_status: 3,
          remark: remark ? `${remark} | 失效原因: ${invalidReason}` : copyright.remark,
          updated_by: operatorId,
        });

        await Content.update(
          { copyright_id: null },
          { where: { copyright_id: id } }
        );

        progress.successCount++;
        result.push({ id, status: 'success' });
      } catch (err: any) {
        progress.failedCount++;
        result.push({ id, status: 'failed', message: err.message });
      }
      progress.processed++;
      progress.progress = Math.round((progress.processed / progress.total) * 100);
    }

    progress.status = 'completed';
    progress.completedAt = new Date().toISOString();

    return { progress, details: result };
  }

  async traceCopyright(query) {
    const where = {} as any;

    if (query.code) where.copyright_code = { [Op.like]: `%${query.code}%` };
    if (query.supplierName) where.supplier_name = { [Op.like]: `%${query.supplierName}%` };
    if (query.contentType) where.content_type = query.contentType;

    const include = [] as any[];
    if (query.contentId) {
      include.push({
        model: Content,
        as: 'contents',
        where: { id: query.contentId },
        attributes: ['id', 'content_title'],
        required: true,
      });
    } else {
      include.push({
        model: Content,
        as: 'contents',
        limit: 20,
        attributes: ['id', 'content_title'],
        required: false,
      });
    }

    const { page, pageSize, offset } = parsePagination(query);
    const { count, rows } = await Copyright.findAndCountAll({
      where,
      include,
      distinct: true,
      offset,
      limit: pageSize,
      order: [['created_at', 'DESC']],
    });

    const tracedData = rows.map((item) => {
      const events = [] as any[];
      events.push({
        id: 1,
        time: item.created_at,
        eventType: 'CREATE',
        eventLabel: '创建版权',
        detail: `创建版权 ${item.copyright_code}`,
      });
      if (item.updated_at && item.updated_at !== item.created_at) {
        events.push({
          id: 2,
          time: item.updated_at,
          eventType: 'UPDATE',
          eventLabel: '更新版权',
          detail: `更新版权信息`,
        });
      }
      return {
        ...this._mapCopyright(item),
        relatedContents: (item.contents || []).map((c: any) => ({
          id: c.id,
          title: c.content_title,
        })),
        traceEvents: events,
      };
    });

    return {
      list: tracedData,
      pagination: {
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      },
    };
  }

  async syncCopyrightToModules(id, action) {
    const copyright = await Copyright.findByPk(id);
    if (!copyright) {
      throw new NotFoundError('版权信息不存在');
    }

    const syncData = {
      copyrightId: copyright.id,
      copyrightCode: copyright.copyright_code,
      action,
      syncTime: new Date().toISOString(),
      syncStatus: 'success',
      syncTargets: ['content_audit', 'risk_control'] as const,
      data: this._mapCopyright(copyright),
    };

    return syncData;
  }
}

module.exports = new CopyrightService();
