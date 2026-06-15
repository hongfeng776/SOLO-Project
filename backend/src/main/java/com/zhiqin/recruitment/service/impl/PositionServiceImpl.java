package com.zhiqin.recruitment.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhiqin.recruitment.common.PositionDetailVO;
import com.zhiqin.recruitment.entity.Enterprise;
import com.zhiqin.recruitment.entity.Position;
import com.zhiqin.recruitment.entity.Resume;
import com.zhiqin.recruitment.mapper.EnterpriseMapper;
import com.zhiqin.recruitment.mapper.PositionMapper;
import com.zhiqin.recruitment.mapper.ResumeMapper;
import com.zhiqin.recruitment.service.PositionService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PositionServiceImpl extends ServiceImpl<PositionMapper, Position> implements PositionService {

    @Autowired
    private EnterpriseMapper enterpriseMapper;

    @Autowired
    private ResumeMapper resumeMapper;

    private static final Map<Integer, String> RESUME_STATUS_MAP = new HashMap<>();

    static {
        RESUME_STATUS_MAP.put(0, "未处理");
        RESUME_STATUS_MAP.put(1, "已查看");
        RESUME_STATUS_MAP.put(2, "面试邀请");
        RESUME_STATUS_MAP.put(3, "已录用");
        RESUME_STATUS_MAP.put(4, "已拒绝");
    }

    @Override
    public IPage<Position> pageList(String title, Long enterpriseId, String category, String city, Integer status, Integer pageNum, Integer pageSize) {
        Page<Position> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Position> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.like(StringUtils.hasText(title), Position::getTitle, title);
        queryWrapper.eq(enterpriseId != null, Position::getEnterpriseId, enterpriseId);
        queryWrapper.like(StringUtils.hasText(category), Position::getCategory, category);
        queryWrapper.like(StringUtils.hasText(city), Position::getCity, city);
        queryWrapper.eq(status != null, Position::getStatus, status);
        queryWrapper.orderByDesc(Position::getCreateTime);
        return this.page(page, queryWrapper);
    }

    @Override
    public IPage<Position> pageListWithExpireCheck(String title, Long enterpriseId, String category, String city, Integer status, Integer pageNum, Integer pageSize) {
        checkAndMarkExpiredPositions();
        return pageList(title, enterpriseId, category, city, status, pageNum, pageSize);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean savePosition(Position position) {
        fillEnterpriseName(position);
        if (position.getViewCount() == null) {
            position.setViewCount(0);
        }
        if (position.getApplyCount() == null) {
            position.setApplyCount(0);
        }
        return this.save(position);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updatePosition(Position position) {
        fillEnterpriseName(position);
        return this.updateById(position);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteBatch(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return false;
        }
        return this.removeByIds(ids);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateStatus(List<Long> ids, Integer status) {
        if (ids == null || ids.isEmpty() || status == null) {
            return false;
        }
        Position update = new Position();
        update.setStatus(status);
        LambdaQueryWrapper<Position> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(Position::getId, ids);
        return this.update(update, wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean online(Long id) {
        Position position = this.getById(id);
        if (position == null) {
            return false;
        }
        if (position.getExpireTime() != null && position.getExpireTime().isBefore(LocalDateTime.now())) {
            position.setExpireTime(LocalDateTime.now().plusDays(30));
        }
        position.setStatus(1);
        return this.updateById(position);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean offline(Long id) {
        Position position = this.getById(id);
        if (position == null) {
            return false;
        }
        position.setStatus(0);
        return this.updateById(position);
    }

    @Override
    public PositionDetailVO getDetail(Long id) {
        Position position = this.getById(id);
        if (position == null) {
            return null;
        }

        PositionDetailVO vo = new PositionDetailVO();
        BeanUtils.copyProperties(position, vo);

        LambdaQueryWrapper<Resume> resumeWrapper = new LambdaQueryWrapper<>();
        resumeWrapper.eq(Resume::getPositionId, id);
        resumeWrapper.orderByDesc(Resume::getCreateTime);
        List<Resume> resumeList = resumeMapper.selectList(resumeWrapper);

        List<PositionDetailVO.ResumeRecordVO> resumeVOList = resumeList.stream().map(resume -> {
            PositionDetailVO.ResumeRecordVO resumeVO = new PositionDetailVO.ResumeRecordVO();
            BeanUtils.copyProperties(resume, resumeVO);
            resumeVO.setApplyTime(resume.getCreateTime());
            resumeVO.setStatusText(RESUME_STATUS_MAP.getOrDefault(resume.getStatus(), "未知"));
            return resumeVO;
        }).collect(Collectors.toList());

        vo.setResumeList(resumeVOList);
        vo.setApplyCount(resumeList.size());

        if (position.getApplyCount() == null || position.getApplyCount() != resumeList.size()) {
            Position update = new Position();
            update.setId(id);
            update.setApplyCount(resumeList.size());
            this.updateById(update);
        }

        return vo;
    }

    @Transactional(rollbackFor = Exception.class)
    public void checkAndMarkExpiredPositions() {
        LocalDateTime now = LocalDateTime.now();
        LambdaQueryWrapper<Position> wrapper = new LambdaQueryWrapper<>();
        wrapper.isNotNull(Position::getExpireTime);
        wrapper.lt(Position::getExpireTime, now);
        wrapper.in(Position::getStatus, 1, 2, 3);

        List<Position> expiredPositions = this.list(wrapper);
        if (!expiredPositions.isEmpty()) {
            expiredPositions.forEach(p -> p.setStatus(4));
            this.updateBatchById(expiredPositions);
        }
    }

    private void fillEnterpriseName(Position position) {
        if (position.getEnterpriseId() != null && (position.getEnterpriseName() == null || position.getEnterpriseName().isEmpty())) {
            Enterprise enterprise = enterpriseMapper.selectById(position.getEnterpriseId());
            if (enterprise != null) {
                position.setEnterpriseName(enterprise.getName());
            }
        }
    }

}
