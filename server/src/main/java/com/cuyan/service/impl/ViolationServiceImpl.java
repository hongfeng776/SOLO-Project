package com.cuyan.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cuyan.common.BusinessException;
import com.cuyan.common.UserContext;
import com.cuyan.dto.ViolationCreateDTO;
import com.cuyan.dto.ViolationHandleDTO;
import com.cuyan.dto.ViolationQueryDTO;
import com.cuyan.entity.User;
import com.cuyan.entity.Violation;
import com.cuyan.mapper.UserMapper;
import com.cuyan.mapper.ViolationMapper;
import com.cuyan.service.ViolationService;
import com.cuyan.vo.ViolationVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ViolationServiceImpl extends ServiceImpl<ViolationMapper, Violation> implements ViolationService {

    private final UserMapper userMapper;

    @Override
    public Page<ViolationVO> pageQuery(ViolationQueryDTO queryDTO) {
        Page<Violation> page = new Page<>(queryDTO.getPageNum(), queryDTO.getPageSize());
        LambdaQueryWrapper<Violation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(queryDTO.getUserId() != null, Violation::getUserId, queryDTO.getUserId())
                .eq(StringUtils.hasText(queryDTO.getTargetType()), Violation::getTargetType, queryDTO.getTargetType())
                .eq(queryDTO.getStatus() != null, Violation::getStatus, queryDTO.getStatus())
                .eq(queryDTO.getHandlerId() != null, Violation::getHandlerId, queryDTO.getHandlerId())
                .like(StringUtils.hasText(queryDTO.getKeyword()), Violation::getReason, queryDTO.getKeyword())
                .orderByDesc(Violation::getCreateTime);
        Page<Violation> violationPage = page(page, wrapper);
        return convertToVOPage(violationPage);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(ViolationCreateDTO createDTO) {
        Violation violation = new Violation();
        BeanUtils.copyProperties(createDTO, violation);
        violation.setStatus(0);
        save(violation);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void handle(ViolationHandleDTO handleDTO) {
        Violation violation = getById(handleDTO.getId());
        if (violation == null) {
            throw new BusinessException("举报记录不存在");
        }
        if (handleDTO.getStatus() != null && handleDTO.getStatus() != 1 && handleDTO.getStatus() != 2) {
            throw new BusinessException("状态值不正确，只能设为1（已处理）或2（已驳回）");
        }
        violation.setStatus(handleDTO.getStatus());
        violation.setHandleResult(handleDTO.getHandleResult());
        violation.setHandlerId(UserContext.getUserId());
        updateById(violation);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeByIds(List<Long> ids) {
        super.removeByIds(ids);
    }

    private Page<ViolationVO> convertToVOPage(Page<Violation> page) {
        Page<ViolationVO> voPage = new Page<>(page.getCurrent(), page.getSize(), page.getTotal());
        List<Violation> records = page.getRecords();
        if (records.isEmpty()) {
            voPage.setRecords(List.of());
            return voPage;
        }
        Set<Long> userIds = records.stream()
                .map(Violation::getUserId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Set<Long> handlerIds = records.stream()
                .map(Violation::getHandlerId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Set<Long> allUserIds = new java.util.HashSet<>();
        allUserIds.addAll(userIds);
        allUserIds.addAll(handlerIds);
        Map<Long, String> userMap = Map.of();
        if (!allUserIds.isEmpty()) {
            userMap = userMapper.selectBatchIds(allUserIds).stream()
                    .collect(Collectors.toMap(User::getId, User::getUsername));
        }
        final Map<Long, String> finalUserMap = userMap;
        List<ViolationVO> voList = records.stream().map(v -> {
            ViolationVO vo = new ViolationVO();
            BeanUtils.copyProperties(v, vo);
            vo.setUserName(finalUserMap.getOrDefault(v.getUserId(), ""));
            vo.setHandlerName(finalUserMap.getOrDefault(v.getHandlerId(), ""));
            return vo;
        }).collect(Collectors.toList());
        voPage.setRecords(voList);
        return voPage;
    }
}
