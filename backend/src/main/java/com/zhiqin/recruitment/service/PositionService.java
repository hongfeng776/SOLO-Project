package com.zhiqin.recruitment.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhiqin.recruitment.entity.Position;

import java.util.List;

public interface PositionService extends IService<Position> {

    IPage<Position> pageList(String title, Long enterpriseId, String category, String city, Integer status, Integer pageNum, Integer pageSize);

    boolean savePosition(Position position);

    boolean updatePosition(Position position);

    boolean deleteBatch(List<Long> ids);

}
