package com.zhiqin.recruitment.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhiqin.recruitment.entity.Enterprise;
import com.zhiqin.recruitment.entity.Position;
import com.zhiqin.recruitment.mapper.EnterpriseMapper;
import com.zhiqin.recruitment.mapper.PositionMapper;
import com.zhiqin.recruitment.service.PositionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class PositionServiceImpl extends ServiceImpl<PositionMapper, Position> implements PositionService {

    @Autowired
    private EnterpriseMapper enterpriseMapper;

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
    @Transactional(rollbackFor = Exception.class)
    public boolean savePosition(Position position) {
        fillEnterpriseName(position);
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

    private void fillEnterpriseName(Position position) {
        if (position.getEnterpriseId() != null && (position.getEnterpriseName() == null || position.getEnterpriseName().isEmpty())) {
            Enterprise enterprise = enterpriseMapper.selectById(position.getEnterpriseId());
            if (enterprise != null) {
                position.setEnterpriseName(enterprise.getName());
            }
        }
    }

}
