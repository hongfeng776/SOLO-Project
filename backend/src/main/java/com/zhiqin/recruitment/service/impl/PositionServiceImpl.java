package com.zhiqin.recruitment.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhiqin.recruitment.entity.Position;
import com.zhiqin.recruitment.mapper.PositionMapper;
import com.zhiqin.recruitment.service.PositionService;
import org.springframework.stereotype.Service;

@Service
public class PositionServiceImpl extends ServiceImpl<PositionMapper, Position> implements PositionService {

    @Override
    public IPage<Position> pageList(String title, Long enterpriseId, String city, Integer status, Integer pageNum, Integer pageSize) {
        Page<Position> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Position> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.like(title != null && !title.isEmpty(), Position::getTitle, title);
        queryWrapper.eq(enterpriseId != null, Position::getEnterpriseId, enterpriseId);
        queryWrapper.eq(city != null && !city.isEmpty(), Position::getCity, city);
        queryWrapper.eq(status != null, Position::getStatus, status);
        queryWrapper.orderByDesc(Position::getCreateTime);
        return this.page(page, queryWrapper);
    }

}
