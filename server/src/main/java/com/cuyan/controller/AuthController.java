package com.cuyan.controller;

import com.cuyan.common.Result;
import com.cuyan.config.JwtConfig;
import com.cuyan.dto.LoginDTO;
import com.cuyan.service.UserService;
import com.cuyan.vo.LoginVO;
import com.cuyan.vo.UserInfoVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtConfig jwtConfig;

    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginDTO loginDTO) {
        return Result.success(userService.login(loginDTO));
    }

    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        String token = request.getHeader(jwtConfig.getHeader());
        if (token != null && token.startsWith(jwtConfig.getPrefix() + " ")) {
            token = token.substring(jwtConfig.getPrefix().length() + 1);
        }
        userService.logout(token);
        return Result.success();
    }

    @GetMapping("/userInfo")
    public Result<UserInfoVO> getUserInfo() {
        return Result.success(userService.getUserInfo());
    }
}
