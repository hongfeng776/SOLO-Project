package com.zhiqin.recruitment.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhiqin.recruitment.entity.JobSeeker;
import com.zhiqin.recruitment.mapper.JobSeekerMapper;
import com.zhiqin.recruitment.service.JobSeekerService;
import org.springframework.stereotype.Service;

@Service
public class JobSeekerServiceImpl extends ServiceImpl<JobSeekerMapper, JobSeeker> implements JobSeekerService {

    @Override
    public IPage<JobSeeker> pageList(String name, Integer gender, String education, Integer status, Integer pageNum, Integer pageSize) {
        Page<JobSeeker> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<JobSeeker> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.like(name != null && !name.isEmpty(), JobSeeker::getName, name);
        queryWrapper.eq(gender != null, JobSeeker::getGender, gender);
        queryWrapper.eq(education != null && !education.isEmpty(), JobSeeker::getEducation, education);
        queryWrapper.eq(status != null, JobSeeker::getStatus, status);
        queryWrapper.orderByDesc(JobSeeker::getCreateTime);
        return this.page(page, queryWrapper);
    }

}
