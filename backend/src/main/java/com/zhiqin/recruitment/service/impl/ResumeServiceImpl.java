package com.zhiqin.recruitment.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhiqin.recruitment.entity.Resume;
import com.zhiqin.recruitment.mapper.ResumeMapper;
import com.zhiqin.recruitment.service.ResumeService;
import org.springframework.stereotype.Service;

@Service
public class ResumeServiceImpl extends ServiceImpl<ResumeMapper, Resume> implements ResumeService {

    @Override
    public IPage<Resume> pageList(String seekerName, Long positionId, Integer status, Integer pageNum, Integer pageSize) {
        Page<Resume> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Resume> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.like(seekerName != null && !seekerName.isEmpty(), Resume::getSeekerName, seekerName);
        queryWrapper.eq(positionId != null, Resume::getPositionId, positionId);
        queryWrapper.eq(status != null, Resume::getStatus, status);
        queryWrapper.orderByDesc(Resume::getCreateTime);
        return this.page(page, queryWrapper);
    }

}
