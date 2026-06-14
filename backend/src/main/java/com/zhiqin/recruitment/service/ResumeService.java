package com.zhiqin.recruitment.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhiqin.recruitment.entity.Resume;

public interface ResumeService extends IService<Resume> {

    IPage<Resume> pageList(String seekerName, Long positionId, Integer status, Integer pageNum, Integer pageSize);

}
