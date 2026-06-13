package com.zhiqin.recruitment.controller;

import com.zhiqin.recruitment.common.LoginDTO;
import com.zhiqin.recruitment.common.LoginVO;
import com.zhiqin.recruitment.common.Result;
import com.zhiqin.recruitment.service.SysAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private SysAdminService sysAdminService;

    @PostMapping("/login")
    public Result<LoginVO> login(@Validated @RequestBody LoginDTO loginDTO) {
        LoginVO loginVO = sysAdminService.login(loginDTO);
        return Result.success(loginVO);
    }

}
