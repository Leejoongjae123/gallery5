'use client'
import React,{use,useEffect} from "react";
import {Form, Input, Button} from "@heroui/react";
import { gallerySignInAction } from "@/app/actions";
import {addToast} from "@heroui/toast"
export default function App({searchParams}) {
  const [errors, setErrors] = React.useState({});
  const error=use(searchParams)?.error
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberLogin, setRememberLogin] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && rememberLogin) {
      const savedEmail = localStorage.getItem('gallery_login_email');
      const savedPassword = localStorage.getItem('gallery_login_password');
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
    }
  }, [rememberLogin]);

  const handleSaveLogin = () => {
    if (typeof window !== 'undefined' && rememberLogin) {
      localStorage.setItem('gallery_login_email', email);
      localStorage.setItem('gallery_login_password', password);
      addToast({
        title: '저장 완료',
        description: '아이디/비밀번호가 저장되었습니다.',
        color: 'success',
      });
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined' && !rememberLogin) {
      localStorage.removeItem('gallery_login_email');
      localStorage.removeItem('gallery_login_password');
    }
  }, [rememberLogin]);

  React.useEffect(()=>{
    if(error){
      addToast({
        title: "로그인 실패",
        description: error,
        color:'danger'
      })
    }
  },[error])
  
  return (
    <Form
      className="w-full h-screen justify-center items-center space-y-4"
      validationErrors={errors}
      action={gallerySignInAction}
    >
      <div className="flex flex-col gap-4 md:max-w-[30%] w-full max-w-[80%]">
        <h1 className="text-2xl font-bold text-center">갤러리 로그인</h1>
        <div className="text-center">
            <p>이용문의 : rena35200@gmail.com </p>
            <a
              href="http://pf.kakao.com/_sBnXn/chat?mode=chat&input=%EC%95%84%EC%9D%B4%EB%94%94%EC%99%80%20%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8%EB%A5%BC%20%EC%9E%8A%EC%96%B4%EB%B2%84%EB%A6%AC%EC%85%A8%EB%82%98%EC%9A%94%3F%20%EA%B0%A4%EB%9F%AC%EB%A6%AC%EB%AA%85%EC%9D%84%20%EB%82%A8%EA%B2%A8%EC%A3%BC%EC%84%B8%EC%9A%94."
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
             >
           비밀번호 찾기 및 문의(클릭)
          </a>
        </div>
        <Input
          isRequired
          label="이메일"
          labelPlacement="outside"
          name="email"
          placeholder="이메일을 입력해주세요"
          type="email"
          autocomplete="email"
          value={email}
          onValueChange={setEmail}
        />

        <Input
          isRequired
          label="비밀번호"
          labelPlacement="outside"
          name="password"
          placeholder="비밀번호를 입력해주세요"
          type="password"
          autocomplete="current-password"
          value={password}
          onValueChange={setPassword}
        />

        <div className="flex gap-4">
          <Button className="w-full" color="primary" type="submit" onClick={handleSaveLogin}>
            로그인
          </Button>
        </div>
        <div className="flex items-center mt-2">
          <input
            id="rememberLogin"
            type="checkbox"
            checked={rememberLogin}
            onChange={e => setRememberLogin(e.target.checked)}
            className="mr-2 w-4 h-4 accent-blue-600"
          />
          <label htmlFor="rememberLogin" className="text-sm select-none">
            로그인 정보 기억하기
          </label>
        </div>
      </div>
    </Form>
  );
}

