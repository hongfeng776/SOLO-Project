package com.zhiqin.recruitment.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhiqin.recruitment.entity.JobSeeker;

public interface JobSeekerService extends IService<JobSeeker> {

    IPage<JobSeeker> pageList(String name, Integer gender, String education, Integer status, Integer pageNum, Integer pageSize);

}
