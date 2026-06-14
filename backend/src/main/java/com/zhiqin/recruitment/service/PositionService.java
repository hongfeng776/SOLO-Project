package com.zhiqin.recruitment.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhiqin.recruitment.entity.Position;

public interface PositionService extends IService<Position> {

    IPage<Position> pageList(String title, Long enterpriseId, String city, Integer status, Integer pageNum, Integer pageSize);

}
