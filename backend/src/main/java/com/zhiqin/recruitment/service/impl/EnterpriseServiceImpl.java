package com.zhiqin.recruitment.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhiqin.recruitment.common.EnterpriseDetailVO;
import com.zhiqin.recruitment.entity.Enterprise;
import com.zhiqin.recruitment.entity.Position;
import com.zhiqin.recruitment.entity.Resume;
import com.zhiqin.recruitment.mapper.EnterpriseMapper;
import com.zhiqin.recruitment.service.EnterpriseService;
import com.zhiqin.recruitment.service.PositionService;
import com.zhiqin.recruitment.service.ResumeService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class EnterpriseServiceImpl extends ServiceImpl<EnterpriseMapper, Enterprise> implements EnterpriseService {

    @Autowired
    private PositionService positionService;

    @Autowired
    private ResumeService resumeService;

    @Override
    public IPage<Enterprise> pageList(String name, String industry, Integer status, String entryTimeStart, String entryTimeEnd, Integer pageNum, Integer pageSize) {
        Page<Enterprise> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Enterprise> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.like(name != null && !name.isEmpty(), Enterprise::getName, name);
        queryWrapper.like(industry != null && !industry.isEmpty(), Enterprise::getIndustry, industry);
        queryWrapper.eq(status != null, Enterprise::getStatus, status);
        if (entryTimeStart != null && !entryTimeStart.isEmpty()) {
            LocalDateTime start = LocalDateTime.of(LocalDate.parse(entryTimeStart), LocalTime.MIN);
            queryWrapper.ge(Enterprise::getEntryTime, start);
        }
        if (entryTimeEnd != null && !entryTimeEnd.isEmpty()) {
            LocalDateTime end = LocalDateTime.of(LocalDate.parse(entryTimeEnd), LocalTime.MAX);
            queryWrapper.le(Enterprise::getEntryTime, end);
        }
        queryWrapper.orderByDesc(Enterprise::getCreateTime);
        return this.page(page, queryWrapper);
    }

    @Override
    public EnterpriseDetailVO getDetail(Long id) {
        Enterprise enterprise = this.getById(id);
        if (enterprise == null) {
            return null;
        }
        EnterpriseDetailVO vo = new EnterpriseDetailVO();
        BeanUtils.copyProperties(enterprise, vo);

        LambdaQueryWrapper<Position> posWrapper = new LambdaQueryWrapper<>();
        posWrapper.eq(Position::getEnterpriseId, id);
        int positionCount = (int) positionService.count(posWrapper);

        LambdaQueryWrapper<Position> activePosWrapper = new LambdaQueryWrapper<>();
        activePosWrapper.eq(Position::getEnterpriseId, id);
        activePosWrapper.eq(Position::getStatus, 1);
        int activePositionCount = (int) positionService.count(activePosWrapper);

        LambdaQueryWrapper<Resume> resumeWrapper = new LambdaQueryWrapper<>();
        resumeWrapper.eq(Resume::getEnterpriseName, enterprise.getName());
        int resumeCount = (int) resumeService.count(resumeWrapper);

        vo.setPositionCount(positionCount);
        vo.setActivePositionCount(activePositionCount);
        vo.setResumeCount(resumeCount);

        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchUpdateStatus(List<Long> ids, Integer status) {
        for (Long id : ids) {
            Enterprise enterprise = new Enterprise();
            enterprise.setId(id);
            enterprise.setStatus(status);
            this.updateById(enterprise);
        }
        if (status == 0) {
            for (Long enterpriseId : ids) {
                LambdaQueryWrapper<Position> wrapper = new LambdaQueryWrapper<>();
                wrapper.eq(Position::getEnterpriseId, enterpriseId);
                wrapper.eq(Position::getStatus, 1);
                Position update = new Position();
                update.setStatus(0);
                positionService.update(update, wrapper);
            }
        } else if (status == 1) {
            for (Long enterpriseId : ids) {
                LambdaQueryWrapper<Position> wrapper = new LambdaQueryWrapper<>();
                wrapper.eq(Position::getEnterpriseId, enterpriseId);
                wrapper.eq(Position::getStatus, 0);
                Position update = new Position();
                update.setStatus(1);
                positionService.update(update, wrapper);
            }
        }
    }

}
