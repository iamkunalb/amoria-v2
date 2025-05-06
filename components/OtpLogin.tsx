'use client'

import React, {FormEvent, useEffect, useState, useTransition} from 'react'
import {auth} from "../firebase"
import {
    ConfirmationResult,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "firebase/auth"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot
} from "../components/ui/input-otp"
import {Input} from "../components/ui/input"
import {Button} from "../components/ui/button"
import { useRouter } from 'next/navigation'

const loadingIndicator = (
    <div role="status" className='flex justify-center'>
        <svg></svg>
    </div>
)


function OtpLogin() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState("");
    const [resendCountdown, setResendCountdown] = useState(0);

    const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
    const [confrimationResult, setConfrimationResult] = useState<ConfirmationResult | null>(null);

    const [isPending, startTrnasition] = useTransition()

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendCountdown > 0){
            timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
        }
        return () => clearTimeout(timer)
    }, [resendCountdown])

    useEffect(() => {
        const recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
                size: "invisible"
            }
        )

        setRecaptchaVerifier(recaptchaVerifier)

        return () =>  {
            recaptchaVerifier.clear();
        }
    }, [auth])

    useEffect(() => {
        const hasEnteredAll = otp.length === 6;
        if (hasEnteredAll){
            verifyOTP()
        }
    }, [otp])

    const verifyOTP = async () => {
        startTrnasition(async () => {
            setError("")

            if(!confrimationResult){
                setError("Enter OTP")
                return
            }

            try {
                await confrimationResult?.confirm(otp)
                console.log("DONE BRO");
                
                router.replace("/")
            }catch (e) {
                console.log(e)

            }
        })
    }

    const requestOtp = async (e?: FormEvent<HTMLFormElement>) => {
        e?.preventDefault();

        setResendCountdown(60)

        startTrnasition(async () => {
            setError("");
            if (!recaptchaVerifier) {
                console.log("captcha issue")
                return setError("Captch not initialied")
            }

            try {
                const confirmResult = await signInWithPhoneNumber(
                    auth,
                    phoneNumber,
                    recaptchaVerifier
                )

                console.log(confirmResult)

                setConfrimationResult(confirmResult)
                setSuccess("Sent")

            }catch (e) {
                console.log(e)
                setResendCountdown(0)
            }
        })
    }


  return (
    <div className='flex flex-col justify-center items-center'>
        {!confrimationResult && (
            <form onSubmit={requestOtp}>
                <Input
                    className='text-black'
                    type='tel'
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className='text-xs text-gray-400 mt-2'>
                    Enter Phone NUmber
                </p>
            </form>
        )}

        {confrimationResult && (
            <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                <InputOTPGroup>
                    <InputOTPSlot index={0}/>
                    <InputOTPSlot index={1}/>
                    <InputOTPSlot index={2}/>
                </InputOTPGroup>
                <InputOTPSeparator/>
                <InputOTPGroup>
                    <InputOTPSlot index={3}/>
                    <InputOTPSlot index={4}/>
                    <InputOTPSlot index={5}/>
                </InputOTPGroup>
            </InputOTP>
        )}

        <Button
            disabled={!phoneNumber || isPending || resendCountdown > 0}
            onClick={() => requestOtp()}
            className='mt-5'
        >
            {resendCountdown > 0
            ? `Resend OTP in ${resendCountdown}`
                : isPending
            ? "Sending OTP"
                : "Send OTP"
            }
        </Button>   

        <div className='p10 text-center'>
            {error && <p className=''text-red-500>{error}</p>}
            {success && <p className=''text-green-500>{success}</p>}
        </div>




      <div id="recaptcha-container"></div>

      {isPending && loadingIndicator}
    </div>
  )
}

export default OtpLogin
