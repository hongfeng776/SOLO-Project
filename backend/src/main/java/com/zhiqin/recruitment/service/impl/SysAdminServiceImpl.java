package com.zhiqin.recruitment.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhiqin.recruitment.common.LoginDTO;
import com.zhiqin.recruitment.common.LoginVO;
import com.zhiqin.recruitment.common.ResultCode;
import com.zhiqin.recruitment.entity.SysAdmin;
import com.zhiqin.recruitment.exception.BusinessException;
import com.zhiqin.recruitment.mapper.SysAdminMapper;
import com.zhiqin.recruitment.service.SysAdminService;
import com.zhiqin.recruitment.utils.JwtUtil;
import com.zhiqin.recruitment.utils.PasswordUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class SysAdminServiceImpl extends ServiceImpl<SysAdminMapper, SysAdmin> implements SysAdminService {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public LoginVO login(LoginDTO loginDTO) {
        LambdaQueryWrapper<SysAdmin> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(SysAdmin::getUsername, loginDTO.getUsername());
        SysAdmin admin = this.getOne(queryWrapper);

        if (admin == null) {
            throw new BusinessException(ResultCode.USERNAME_PASSWORD_ERROR);
        }

        if (!PasswordUtil.matches(loginDTO.getPassword(), admin.getPassword())) {
            throw new BusinessException(ResultCode.USERNAME_PASSWORD_ERROR);
        }

        if (admin.getStatus() != null && admin.getStatus() == 0) {
            throw new BusinessException(ResultCode.USER_DISABLED);
        }

        String token = jwtUtil.generateToken(admin.getUsername());

        LoginVO loginVO = new LoginVO();
        loginVO.setToken(token);
        loginVO.setId(admin.getId());
        loginVO.setUsername(admin.getUsername());
        loginVO.setNickname(admin.getNickname());
        loginVO.setAvatar(admin.getAvatar());
        loginVO.setRoles(Arrays.asList("admin"));

        return loginVO;
    }

}
