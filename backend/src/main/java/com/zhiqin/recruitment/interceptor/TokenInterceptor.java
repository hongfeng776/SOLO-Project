package com.zhiqin.recruitment.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhiqin.recruitment.common.Result;
import com.zhiqin.recruitment.common.ResultCode;
import com.zhiqin.recruitment.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class TokenInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    private static final String AUTHORIZATION = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authHeader = request.getHeader(AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            writeUnauthorized(response, ResultCode.UNAUTHORIZED);
            return false;
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        if (token.isEmpty()) {
            writeUnauthorized(response, ResultCode.UNAUTHORIZED);
            return false;
        }

        try {
            if (jwtUtil.isTokenExpired(token)) {
                writeUnauthorized(response, ResultCode.TOKEN_EXPIRED);
                return false;
            }
            String username = jwtUtil.getUsernameFromToken(token);
            if (username == null || username.isEmpty()) {
                writeUnauthorized(response, ResultCode.TOKEN_INVALID);
                return false;
            }
            request.setAttribute("username", username);
        } catch (Exception e) {
            writeUnauthorized(response, ResultCode.TOKEN_INVALID);
            return false;
        }

        return true;
    }

    private void writeUnauthorized(HttpServletResponse response, ResultCode resultCode) throws Exception {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        Result<?> result = Result.fail(resultCode);
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }

}
