"use client" 
import OtpLogin from '@/components/OtpLogin'
import React, { useEffect, useRef, useState, useTransition } from 'react'
import { Geist, Geist_Mono } from "next/font/google";
import { useRouter } from 'next/navigation';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/firebase';


import { db } from "../../firebase";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});
  
const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});






function Login() {
    const containerRef = useRef(null);
    const [currentSection, setCurrentSection] = useState('hero');

    const sectionOrder = [
        'hero', 
        'phone', 
        'otp',
        // 'email',
        'user-info', 
        'mbti1', 
        'mbti2', 
        'mbti3', 
        'mbti4', 
        'mbti5', 
        'mbti6', 
        'mbti7', 
        'mbti8', 
        'mbti9', 
        'mbti10',
        'face-preferences',
        'selfie-upload',
        'submit',
        'location-direction'
    ];

    const COUNTRY_CODES = [
        { code: '+93', country: '🇦🇫 Afghanistan' },
        { code: '+355', country: '🇦🇱 Albania' },
        { code: '+213', country: '🇩🇿 Algeria' },
        { code: '+376', country: '🇦🇩 Andorra' },
        { code: '+244', country: '🇦🇴 Angola' },
        { code: '+1', country: '🇦🇮 Antigua' },
        { code: '+54', country: '🇦🇷 Argentina' },
        { code: '+374', country: '🇦🇲 Armenia' },
        { code: '+61', country: '🇦🇺 +61' },
        { code: '+43', country: '🇦🇹 Austria' },
        { code: '+994', country: '🇦🇿 Azerbaijan' },
        { code: '+1', country: '🇧🇸 Bahamas' },
        { code: '+973', country: '🇧🇭 Bahrain' },
        { code: '+880', country: '🇧🇩 Bangladesh' },
        { code: '+1', country: '🇧🇧 Barbados' },
        { code: '+375', country: '🇧🇾 Belarus' },
        { code: '+32', country: '🇧🇪 Belgium' },
        { code: '+501', country: '🇧🇿 Belize' },
        { code: '+229', country: '🇧🇯 Benin' },
        { code: '+975', country: '🇧🇹 Bhutan' },
        { code: '+591', country: '🇧🇴 Bolivia' },
        { code: '+387', country: '🇧🇦 Bosnia' },
        { code: '+267', country: '🇧🇼 Botswana' },
        { code: '+55', country: '🇧🇷 Brazil' },
        { code: '+673', country: '🇧🇳 Brunei' },
        { code: '+359', country: '🇧🇬 Bulgaria' },
        { code: '+226', country: '🇧🇫 Burkina Faso' },
        { code: '+257', country: '🇧🇮 Burundi' },
        { code: '+855', country: '🇰🇭 Cambodia' },
        { code: '+237', country: '🇨🇲 Cameroon' },
        { code: '+1', country: '🇨🇦 Canada' },
        { code: '+238', country: '🇨🇻 Cape Verde' },
        { code: '+236', country: '🇨🇫 Central African Republic' },
        { code: '+235', country: '🇹🇩 Chad' },
        { code: '+56', country: '🇨🇱 Chile' },
        { code: '+86', country: '🇨🇳 China' },
        { code: '+57', country: '🇨🇴 Colombia' },
        { code: '+269', country: '🇰🇲 Comoros' },
        { code: '+242', country: '🇨🇬 Congo' },
        { code: '+506', country: '🇨🇷 Costa Rica' },
        { code: '+385', country: '🇭🇷 Croatia' },
        { code: '+53', country: '🇨🇺 Cuba' },
        { code: '+357', country: '🇨🇾 Cyprus' },
        { code: '+420', country: '🇨🇿 Czech Republic' },
        { code: '+45', country: '🇩🇰 Denmark' },
        { code: '+253', country: '🇩🇯 Djibouti' },
        { code: '+1', country: '🇩🇲 Dominica' },
        { code: '+1', country: '🇩🇴 Dominican Republic' },
        { code: '+670', country: '🇹🇱 East Timor' },
        { code: '+593', country: '🇪🇨 Ecuador' },
        { code: '+20', country: '🇪🇬 Egypt' },
        { code: '+503', country: '🇸🇻 El Salvador' },
        { code: '+240', country: '🇬🇶 Equatorial Guinea' },
        { code: '+291', country: '🇪🇷 Eritrea' },
        { code: '+372', country: '🇪🇪 Estonia' },
        { code: '+251', country: '🇪🇹 Ethiopia' },
        { code: '+679', country: '🇫🇯 Fiji' },
        { code: '+358', country: '🇫🇮 Finland' },
        { code: '+33', country: '🇫🇷 France' },
        { code: '+241', country: '🇬🇦 Gabon' },
        { code: '+220', country: '🇬🇲 Gambia' },
        { code: '+995', country: '🇬🇪 Georgia' },
        { code: '+49', country: '🇩🇪 Germany' },
        { code: '+233', country: '🇬🇭 Ghana' },
        { code: '+30', country: '🇬🇷 Greece' },
        { code: '+1', country: '🇬🇩 Grenada' },
        { code: '+502', country: '🇬🇹 Guatemala' },
        { code: '+224', country: '🇬🇳 Guinea' },
        { code: '+245', country: '🇬🇼 Guinea-Bissau' },
        { code: '+592', country: '🇬🇾 Guyana' },
        { code: '+509', country: '🇭🇹 Haiti' },
        { code: '+504', country: '🇭🇳 Honduras' },
        { code: '+852', country: '🇭🇰 Hong Kong' },
        { code: '+36', country: '🇭🇺 Hungary' },
        { code: '+354', country: '🇮🇸 Iceland' },
        { code: '+91', country: '🇮🇳 India' },
        { code: '+62', country: '🇮🇩 Indonesia' },
        { code: '+98', country: '🇮🇷 Iran' },
        { code: '+964', country: '🇮🇶 Iraq' },
        { code: '+353', country: '🇮🇪 Ireland' },
        { code: '+972', country: '🇮🇱 Israel' },
        { code: '+39', country: '🇮🇹 Italy' },
        { code: '+1', country: '🇯🇲 Jamaica' },
        { code: '+81', country: '🇯🇵 Japan' },
        { code: '+962', country: '🇯🇴 Jordan' },
        { code: '+7', country: '🇰🇿 Kazakhstan' },
        { code: '+254', country: '🇰🇪 Kenya' },
        { code: '+686', country: '🇰🇮 Kiribati' },
        { code: '+850', country: '🇰🇵 North Korea' },
        { code: '+82', country: '🇰🇷 South Korea' },
        { code: '+965', country: '🇰🇼 Kuwait' },
        { code: '+996', country: '🇰🇬 Kyrgyzstan' },
        { code: '+856', country: '🇱🇦 Laos' },
        { code: '+371', country: '🇱🇻 Latvia' },
        { code: '+961', country: '🇱🇧 Lebanon' },
        { code: '+266', country: '🇱🇸 Lesotho' },
        { code: '+231', country: '🇱🇷 Liberia' },
        { code: '+218', country: '🇱🇾 Libya' },
        { code: '+423', country: '🇱🇮 Liechtenstein' },
        { code: '+370', country: '🇱🇹 Lithuania' },
        { code: '+352', country: '🇱🇺 Luxembourg' },
        { code: '+853', country: '🇲🇴 Macau' },
        { code: '+389', country: '🇲🇰 Macedonia' },
        { code: '+261', country: '🇲🇬 Madagascar' },
        { code: '+265', country: '🇲🇼 Malawi' },
        { code: '+60', country: '🇲🇾 Malaysia' },
        { code: '+960', country: '🇲🇻 Maldives' },
        { code: '+223', country: '🇲🇱 Mali' },
        { code: '+356', country: '🇲🇹 Malta' },
        { code: '+692', country: '🇲🇭 Marshall Islands' },
        { code: '+222', country: '🇲🇷 Mauritania' },
        { code: '+230', country: '🇲🇺 Mauritius' },
        { code: '+52', country: '🇲🇽 Mexico' },
        { code: '+691', country: '🇫🇲 Micronesia' },
        { code: '+373', country: '🇲🇩 Moldova' },
        { code: '+377', country: '🇲🇨 Monaco' },
        { code: '+976', country: '🇲🇳 Mongolia' },
        { code: '+382', country: '🇲🇪 Montenegro' },
        { code: '+212', country: '🇲🇦 Morocco' },
        { code: '+258', country: '🇲🇿 Mozambique' },
        { code: '+95', country: '🇲🇲 Myanmar' },
        { code: '+264', country: '🇳🇦 Namibia' },
        { code: '+674', country: '🇳🇷 Nauru' },
        { code: '+977', country: '🇳🇵 Nepal' },
        { code: '+31', country: '🇳🇱 Netherlands' },
        { code: '+64', country: '🇳🇿 New Zealand' },
        { code: '+505', country: '🇳🇮 Nicaragua' },
        { code: '+227', country: '🇳🇪 Niger' },
        { code: '+234', country: '🇳🇬 Nigeria' },
        { code: '+47', country: '🇳🇴 Norway' },
        { code: '+968', country: '🇴🇲 Oman' },
        { code: '+92', country: '🇵🇰 Pakistan' },
        { code: '+680', country: '🇵🇼 Palau' },
        { code: '+970', country: '🇵🇸 Palestine' },
        { code: '+507', country: '🇵🇦 Panama' },
        { code: '+675', country: '🇵🇬 Papua New Guinea' },
        { code: '+595', country: '🇵🇾 Paraguay' },
        { code: '+51', country: '🇵🇪 Peru' },
        { code: '+63', country: '🇵🇭 Philippines' },
        { code: '+48', country: '🇵🇱 Poland' },
        { code: '+351', country: '🇵🇹 Portugal' },
        { code: '+974', country: '🇶🇦 Qatar' },
        { code: '+40', country: '🇷🇴 Romania' },
        { code: '+7', country: '🇷🇺 Russia' },
        { code: '+250', country: '🇷🇼 Rwanda' },
        { code: '+1', country: '🇰🇳 Saint Kitts and Nevis' },
        { code: '+1', country: '🇱🇨 Saint Lucia' },
        { code: '+1', country: '🇻🇨 Saint Vincent' },
        { code: '+685', country: '🇼🇸 Samoa' },
        { code: '+378', country: '🇸🇲 San Marino' },
        { code: '+239', country: '🇸🇹 Sao Tome and Principe' },
        { code: '+966', country: '🇸🇦 Saudi Arabia' },
        { code: '+221', country: '🇸🇳 Senegal' },
        { code: '+381', country: '🇷🇸 Serbia' },
        { code: '+248', country: '🇸🇨 Seychelles' },
        { code: '+232', country: '🇸🇱 Sierra Leone' },
        { code: '+65', country: '🇸🇬 Singapore' },
        { code: '+421', country: '🇸🇰 Slovakia' },
        { code: '+386', country: '🇸🇮 Slovenia' },
        { code: '+677', country: '🇸🇧 Solomon Islands' },
        { code: '+252', country: '🇸🇴 Somalia' },
        { code: '+27', country: '🇿🇦 South Africa' },
        { code: '+211', country: '🇸🇸 South Sudan' },
        { code: '+34', country: '🇪🇸 Spain' },
        { code: '+94', country: '🇱🇰 Sri Lanka' },
        { code: '+249', country: '🇸🇩 Sudan' },
        { code: '+597', country: '🇸🇷 Suriname' },
        { code: '+268', country: '🇸🇿 Swaziland' },
        { code: '+46', country: '🇸🇪 Sweden' },
        { code: '+41', country: '🇨🇭 Switzerland' },
        { code: '+963', country: '🇸🇾 Syria' },
        { code: '+886', country: '🇹🇼 Taiwan' },
        { code: '+992', country: '🇹🇯 Tajikistan' },
        { code: '+255', country: '🇹🇿 Tanzania' },
        { code: '+66', country: '🇹🇭 Thailand' },
        { code: '+228', country: '🇹🇬 Togo' },
        { code: '+676', country: '🇹🇴 Tonga' },
        { code: '+1', country: '🇹🇹 Trinidad and Tobago' },
        { code: '+216', country: '🇹🇳 Tunisia' },
        { code: '+90', country: '🇹🇷 Turkey' },
        { code: '+993', country: '🇹🇲 Turkmenistan' },
        { code: '+688', country: '🇹🇻 Tuvalu' },
        { code: '+256', country: '🇺🇬 Uganda' },
        { code: '+380', country: '🇺🇦 Ukraine' },
        { code: '+971', country: '🇦🇪 United Arab Emirates' },
        { code: '+44', country: '🇬🇧 United Kingdom' },
        { code: '+1', country: '🇺🇸 United States' },
        { code: '+598', country: '🇺🇾 Uruguay' },
        { code: '+998', country: '🇺🇿 Uzbekistan' },
        { code: '+678', country: '🇻🇺 Vanuatu' },
        { code: '+379', country: '🇻🇦 Vatican City' },
        { code: '+58', country: '🇻🇪 Venezuela' },
        { code: '+84', country: '🇻🇳 Vietnam' },
        { code: '+967', country: '🇾🇪 Yemen' },
        { code: '+260', country: '🇿🇲 Zambia' },
        { code: '+263', country: '🇿🇼 Zimbabwe' }
      ];

    const [selectedFaces, setSelectedFaces] = useState(new Set());
    const [showModal, setShowModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
      phoneNumber: '',
      firstName: '',
      lastName: '',
      age: '',
      gender: '',
      sexualOrientation: '',
      personalityAnswers: Array(10).fill(null),
      selectedFaces: [],
      selfieImage: null,
      userFaceType: null,
      mbti: ''
    });
    const [matchResults, setMatchResults] = useState([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [countryCode, setCountryCode] = useState('+61');
    const [verificationInputs, setVerificationInputs] = useState(['', '', '', '', '', '']);
    const [userLocation, setUserLocation] = useState(null);
    const [matchLocations, setMatchLocations] = useState({});
    const [watchId, setWatchId] = useState(null);
    const [compass, setCompass] = useState(null);
    const [locationStatus, setLocationStatus] = useState('waiting'); // 'waiting', 'active', 'error'
    const [compassStatus, setCompassStatus] = useState('waiting'); // 'waiting', 'active', 'error'



    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState("");
    const [resendCountdown, setResendCountdown] = useState(0);

    const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
    const [confrimationResult, setConfrimationResult] = useState<ConfirmationResult | null>(null);

    const [isPending, startTrnasition] = useTransition()

    const navigateToSection = (section: string) => {
        setCurrentSection(section);
        const sectionElement = document.getElementById(section);
        if (sectionElement && containerRef.current) {
          const containerElement = containerRef.current as HTMLElement;
          containerElement.style.transform = `translateY(-${sectionElement.offsetTop}px)`;
        }
    }
    
    const goBack = () => {
        const currentIndex = sectionOrder.indexOf(currentSection);
        if (currentIndex > 0) {
          navigateToSection(sectionOrder[currentIndex - 1]);
        }
    };
    
    const NavigationButtons = ({ showBack = true }) => (
        <div className="flex gap-4 w-full mt-8">
            {showBack && currentSection !== 'hero' && (
            <button 
                onClick={goBack}
                className="flex-1 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] font-medium px-8 py-3"
            >
                Back
            </button>
            )}
            {currentSection !== 'contact' && (
            <button 
                onClick={() => navigateToSection(sectionOrder[sectionOrder.indexOf(currentSection) + 1])}
                className="flex-1 rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium px-8 py-3"
            >
                {currentSection === 'hero' ? 'Get Started' : 'Next'}
            </button>
            )}
        </div>
    );

    const handleSendVerificationCode = async () => {
        const phNum = `${countryCode}${formData.phoneNumber}`;
        setPhoneNumber(phNum); // this is optional now
        requestOtp(phNum);
      };
      

    const requestOtp = async (phNum: string) => {
        setResendCountdown(60);
      
        startTrnasition(async () => {
          setError("");
      
          if (!recaptchaVerifier) {
            console.log("captcha issue");
            return setError("Captcha not initialized");
          }
      
          try {
            const confirmResult = await signInWithPhoneNumber(auth, phNum, recaptchaVerifier);
            setConfrimationResult(confirmResult);
            setSuccess("Sent");
          } catch (e) {
            console.log(e);
            setResendCountdown(0);
          }
        });
      };

    const verifyOTP = async () => {
        startTrnasition(async () => {
            setError("")

            if(!confrimationResult){
                setError("Enter OTP")
                return
            }

            console.log("otp", verificationInputs.join(''));
            

            try {
                await confrimationResult?.confirm(verificationInputs.join(''))
                console.log("DONE BRO");
                
                router.replace("/")
            }catch (e) {
                console.log(e)  

            }
        })
    }

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

  return (
    // <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
    //   <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
    //     <h1>
    //         Login
    //     </h1>
    //     <OtpLogin/>
    //   </main>
    // </div>
    <div className={`${geistSans.className} ${geistMono.className} h-screen overflow-hidden`}>
        <div id="recaptcha-container"></div>

        <div ref={containerRef} className="transition-transform duration-1000 ease-in-out">
            {/* Hero Section */}
            <section id="hero" className="h-screen flex items-center justify-center p-4">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6">Amoria.</h1>
                    <p className="text-lg sm:text-xl mb-6 sm:mb-8 font-[family-name:var(--font-geist-mono)]">
                    Intelligent matching for meaningful connections
                    </p>
                    <NavigationButtons showBack={false} />
                </div>
            </section>

            {/* Phone Number Section */}
            <section id="phone" className="h-screen flex items-center bg-black/[.05] dark:bg-white/[.06] p-4">
                <div className="w-full max-w-4xl mx-auto px-4">
                    <h2 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center">Phone Number</h2>
                    <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
                    <div className="flex gap-2">
                        <select 
                        className="w-32 sm:w-40 p-2 sm:p-3 text-sm sm:text-base rounded-lg bg-white dark:bg-black border font-[family-name:var(--font-geist-mono)]"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        >
                        {COUNTRY_CODES.map(({ code, country }) => (
                            <option key={`${code}-${country}`} value={code}>
                            {country}
                            </option>
                        ))}
                        </select>
                        <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => {
                            // Only allow numbers and limit length
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            if (value.length <= 10) {
                            setFormData(prev => ({ ...prev, phoneNumber: value }));
                            }
                        }}
                        placeholder="Enter your phone number"
                        className="flex-1 p-2 sm:p-3 text-sm sm:text-base rounded-lg bg-white dark:bg-black border font-[family-name:var(--font-geist-mono)]"
                        />
                    </div>
                    <button 
                        onClick={handleSendVerificationCode}
                        disabled={!formData.phoneNumber || isCodeSent}
                        className={`w-full rounded-full border border-solid transition-colors flex items-center justify-center gap-2 font-medium px-8 py-3
                        ${!formData.phoneNumber || isCodeSent
                            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400 border-transparent'
                            : 'bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] border-transparent'
                        }`}
                    >
                        {isCodeSent ? (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Code Sent
                        </>
                        ) : (
                        'Send Verification Code'
                        )}
                    </button>
                    <p className="text-sm text-center font-[family-name:var(--font-geist-mono)] text-gray-600 dark:text-gray-400">
                        We'll send you a verification code to get started
                    </p>
                    <NavigationButtons />
                    </div>
                </div>
            </section>

            {/* OTP Section */}
            <section id="otp" className="h-screen flex items-center bg-black/[.05] dark:bg-white/[.06] p-4">
                <div className="w-full max-w-4xl mx-auto px-4">
                    <h2 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center">Verification Code</h2>
                    <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
                    <div className="flex justify-between gap-1 sm:gap-2">
                        {[...Array(6)].map((_, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength={1}
                            inputMode="numeric"
                            pattern="\d*"
                            value={verificationInputs[index]}
                            className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl rounded-lg bg-white dark:bg-black border font-[family-name:var(--font-geist-mono)] focus:border-2 focus:border-black dark:focus:border-white outline-none"
                            onKeyUp={(e) => {
                            const target = e.target as HTMLInputElement;
                            // Move to next input when digit is entered
                            if (target.value && index < 5) {
                                (target.nextElementSibling as HTMLInputElement)?.focus();
                            }
                            // Move to previous input on backspace if empty
                            if (e.key === 'Backspace' && !target.value && index > 0) {
                                (target.previousElementSibling as HTMLInputElement)?.focus();
                            }
                            }}
                            onChange={(e) => {
                            // Only allow numbers
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            
                            // Update the verification inputs array
                            const newInputs = [...verificationInputs];
                            newInputs[index] = value;
                            setVerificationInputs(newInputs);

                            // If pasting a full code
                            if (e.target.value.length > 1) {
                                const pastedValue = e.target.value.replace(/[^0-9]/g, '').split('');
                                const newInputs = [...verificationInputs];
                                for (let i = 0; i < 6; i++) {
                                newInputs[i] = pastedValue[i] || '';
                                }
                                setVerificationInputs(newInputs);
                            }
                            }}
                        />
                        ))}
                    </div>
                    <p className="text-sm text-center font-[family-name:var(--font-geist-mono)] text-gray-600 dark:text-gray-400">
                        Enter the 6-digit code we sent to your phone
                    </p>
                    <button 
                        onClick={verifyOTP}
                        className={`w-full rounded-full border border-solid transition-colors flex items-center justify-center gap-2 font-medium px-8 py-3
                        ${verificationInputs.join('').length === 6
                            ? 'bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] border-transparent'
                            : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400 border-transparent'
                        }`}
                    >
                        Verify Code
                    </button>
                    <p className="text-sm text-center font-[family-name:var(--font-geist-mono)] text-gray-600 dark:text-gray-400">
                        Didn't receive the code? 
                        <button 
                        onClick={() => handleSendVerificationCode()}
                        className="text-blue-500 hover:underline ml-1"
                        >
                        Resend
                        </button>
                    </p>
                    <NavigationButtons />
                    </div>
                </div>
            </section>
        </div>
    </div>
  )
}

export default Login
