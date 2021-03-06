/**
 * Created 蓝羽教学 on 2020/2/24.
 */
$(() => {

    let image_code_uuid = '';   //uuid

    let isMobileFlag = false;
    isUsernameFlag = false;
    send_flag = true;

    let $img = $('.form-item .captcha-graph-img img'); // 获取图像
    genre();
    $img.click(genre);

    function genre() {
        image_code_uuid = generateUUID();
        let imageCodeUrl = '/image_code/' + image_code_uuid + '/';

        $img.attr('src', imageCodeUrl)
    }

    // 生成图片UUID验证码
    function generateUUID() {
        let d = new Date().getTime();
        if (window.performance && typeof window.performance.now === "function") {
            d += performance.now(); //use high-precision timer if available
        }
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }


    // 手机号验证
    let $mobile = $('#mobile');
    $mobile.blur(fn_check_mobile);

    function fn_check_mobile() {
        isMobileFlag = false;
        let sMobile = $mobile.val();
        if (sMobile === '') {
            message.showError('手机号不能为空！');
            return
        }
        if (!(/^1[3456789]\d{9}$/).test(sMobile)) {
            message.showError('手机号格式错误，请重新输入！')
            return
        }

        $.ajax({
            url: '/mobiles/' + sMobile + '/',
            type: 'GET',
            dataType: 'json'
        })
            .done(function (res) {
                if (res.data.count == 0) {
                    message.showError('手机号没有被注册，请重新输入！')
                } else {
                    message.showSuccess('可以正常使用');
                    isMobileFlag = true
                }
            })
            .fail(function () {
                message.showError('服务器超时，请重试！')
            })
    }

    // 短信发送
    let $smsCodeBtn = $('.form-item .sms-captcha');  // 获取按钮元素
    let $imgCodeText = $('#input_captcha'); //  图形码

    $smsCodeBtn.click(function () {
        // 参数验证   手机号    图形文字   uuid
        // 发送ajax
        // 成功和失败回调
        if (send_flag) {
            send_flag = false;
            if (!isMobileFlag) {
                fn_check_mobile();
                return
            }
            // 验证图形
            let text = $imgCodeText.val();
            if (!text) {
                message.showError('请输入图形验证码！');
                return
            }

            if (!image_code_uuid) {
                message.showError('图形UUID为空');
                return
            }

            // 发送ajax
            // 声明参数
            let DataParams = {
                'mobile': $mobile.val(),
                'text': text,
                'image_code_id': image_code_uuid
            };

            $.ajax({
                url: '/sms_code/',
                type: 'POST',
                headers: {
                    "X-CSRFToken": getCookie('csrftoken')
                },
                data: JSON.stringify(DataParams),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
            })
                .done(function (res) {
                    // 响应成功
                    if (res.errno === '0') {
                        message.showSuccess('短信验证码发送成功');
                        // 倒计时
                        let num = 60;
                        let t = setInterval(function () {
                            if (num === 1) {
                                // 清楚定时器
                                clearInterval(t);
                                $smsCodeBtn.html('获取短信验证码');
                                send_flag = true;
                            } else {
                                num -= 1;
                                // 展示倒计时信息
                                $smsCodeBtn.html(num + '秒')
                            }
                        }, 1000);
                    } else {
                        message.showError(res.errmsg);
                        send_flag = true
                    }
                })
                .fail(function () {
                    message.showError('服务器超时，请重试！')
                })


        } else {
            message.showError('短信验证码发送频繁，请耐心等待')
        }


    });


    // 5、注册逻辑
    let $register = $('.form-contain');  // 获取注册表单元素

    $register.submit(function (e) {
        // 阻止默认提交操作
        e.preventDefault();
        // 获取用户输入的内容

        let sPassword = $("input[name=password]").val();

        let sMobile = $mobile.val();  // 获取用户输入的手机号码字符串
        let sSmsCode = $("input[name=sms_captcha]").val();

        // 判断手机号是否为空，是否已注册
        if (!isMobileFlag) {
            fn_check_mobile();
            return
        }

        // 判断用户输入的密码是否为空
        if ((!sPassword)) {
            message.showError('密码或确认密码不能为空');
            return
        }

        // 判断用户输入的密码和确认密码长度是否为6-20位
        if (!(/^[0-9A-Za-z]{6,20}$/).test(sPassword)) {
            message.showError('请输入6到20位密码');
            return
        }

        // 判断用户输入的短信验证码是否为6位数字
        if (!(/^\d{6}$/).test(sSmsCode)) {
            message.showError('短信验证码格式不正确，必须为6位数字！');
            return
        }

        // 发起注册请求
        // 1、创建请求参数
        let SdataParams = {
            "password": sPassword,
            "mobile": sMobile,
            "sms_code": sSmsCode
        };
        // 2、创建ajax请求
        $.ajax({
            // 请求地址
            url: "/user/forgetpwd/",  // url尾部需要添加/
            // 请求方式
            type: "POST",
            data: JSON.stringify(SdataParams),
            headers: {
                // 根据后端开启的CSRFProtect保护，cookie字段名固定为X-CSRFToken
                "X-CSRFToken": getCookie("csrftoken")
            },
            // 请求内容的数据类型（前端发给后端的格式）
            contentType: "application/json; charset=utf-8",
            // 响应数据的格式（后端返回给前端的格式）
            dataType: "json",

        })
            .done(function (res) {
                if (res.errno === "0") {
                    // 注册成功
                    message.showSuccess(res.errmsg);
                    setTimeout(() => {
                        // 注册成功之后重定向到主页
                        window.location.href = '/user/login/';
                    }, 1500)
                } else {
                    // 注册失败，打印错误信息
                    message.showError(res.errmsg);
                }
            })
            .fail(function () {
                message.showError('服务器超时，请重试！');
            });

    });


    // 获取cookie
    // get cookie using jQuery
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {

            let cookies = document.cookie.split(';');

            for (let i = 0; i < cookies.length; i++) {

                let cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));

                    break;
                }
            }
        }
        return cookieValue;

    }
});

