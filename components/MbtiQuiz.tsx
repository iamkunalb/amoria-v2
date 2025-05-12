"use client" 
import OtpLogin from '@/components/OtpLogin'
import React, { use, useEffect, useRef, useState, useTransition } from 'react'
import { Geist, Geist_Mono } from "next/font/google";
import { useRouter } from 'next/navigation';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth';
import { auth, db} from '@/firebase';
import Image from 'next/image';
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from './AuthProvider';
import Matches from './Matches';
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateDoc } from "firebase/firestore";
import { FaSpinner } from "react-icons/fa";

const storage = getStorage();



const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});
  
const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});


function MbtiQuiz() {

    const {user} = useAuth();

    const [submitted, setSubmitted] = useState(false)

    const containerRef = useRef(null);
    const [currentSection, setCurrentSection] = useState('user-info');

    const [selectedFaces, setSelectedFaces] = useState(new Set());
    const [showModal, setShowModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
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
    const [gender, setGender] = useState("")

    useEffect(() => {
        if (user && user.phoneNumber !== null) {
            setFormData({...formData, phoneNumber: user.phoneNumber});
        }
    }, [])
    
    

    
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

    const sectionOrder = [
        'user-info', 
        // 'mbti1', 
        // 'mbti2', 
        // 'mbti3', 
        // 'mbti4', 
        // 'mbti5', 
        // 'mbti6', 
        // 'mbti7', 
        // 'mbti8', 
        // 'mbti9', 
        // 'mbti10',
        // 'face-preferences',
        'selfie-upload',
        'submit',
        // 'location-direction'
    ];

    const navigateToSection = (section: string) => {
        setCurrentSection(section);
        const sectionElement = document.getElementById(section);
        if (sectionElement && containerRef.current) {
          const container = containerRef.current as HTMLElement;
          container.style.transform = `translateY(-${sectionElement.offsetTop}px)`;
        }
    }


    
    
    const goBack = () => {
        const currentIndex = sectionOrder.indexOf(currentSection);
        if (currentIndex > 0) {
          navigateToSection(sectionOrder[currentIndex - 1]);
        }
    };

    const [userDataExists, setUserDataExists] = useState(false);
    const [loading, setLoading] = useState(true);
    const [matchData, setMatchData] = useState(null);

    const [userId, setUserId] = useState(null);

    const auth = getAuth();
    const db = getFirestore();

    const uploadUserPhoto = async (file: Blob | ArrayBuffer | Uint8Array<ArrayBufferLike>, userId: any) => {
        const fileRef = ref(storage, `user_photos/${userId}.jpg`);
      
        // Upload file
        await uploadBytes(fileRef, file);
      
        // Get downloadable URL
        const downloadURL = await getDownloadURL(fileRef);
      
        return downloadURL;
      };

      const savePhotoURLToUser = async (userId: any, url: any) => {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          avatar: url
        });
      };
    

    useEffect(() => {
        const loadUserId = async () => {
            try {
                const id = await getUserIdByPhone();
                setUserId(id as unknown as null);
            } catch (e) {
                if (e instanceof Error) {
                    console.error("Failed to get user ID:", e.message);
                } else {
                    console.error("Failed to get user ID:", e);
                }
            }

            loadUserId();
        }   
    }, []);


    const getUserIdByPhone = async () => {
        const user = auth.currentUser;
      
        if (!user || !user.phoneNumber) {
          throw new Error("User not logged in or missing phone number");
        }
      
        const q = query(
          collection(db, "users"),
          where("phoneNumber", "==", user.phoneNumber)
        );
      
        const snapshot = await getDocs(q);
      
        if (snapshot.empty) {
          throw new Error("User data not found in Firestore");
        }
      
        const userDoc = snapshot.docs[0];
        const userId = userDoc.id; // 🔥 This is the ID you use in /match/{user_id}

        setUserId(userId as unknown as null);
        console.log(userId);
        
      
        return userId;
      };

    const [showInitialLoading, setShowInitialLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
          const user = auth.currentUser;
          if (!user) return;

          const q = query(
            collection(db, "users"),
            where("phoneNumber", "==", user.phoneNumber)
          );
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            setUserDataExists(true);
          } else {
            setUserDataExists(false);
          }
          setLoading(false);

          // Show loading for at least 1 second before rendering the actual screen
          setTimeout(() => {
            setShowInitialLoading(false);
          }, 1000);
        };

        checkUser();
    }, []);
    
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
                    Next
                </button>
            )}
        </div>
    );

    const womenFaces = [
        'women/asian_cute.jpg',
        'women/persian.jpg',
        'women/asian.jpg',
        'women/latina.png',
        'women/nerdy.png',
        'women/plumpy.png',
        'women/swedish.png',
        'women/chubby.jpeg',
        'women/exotic_chiseled.jpg'
        // Add all women reference faces here
      ];
    
      const menFaces = [
        'men/black_man.jpg',
        'men/nerdy_clean.jpg',
        'men/white_artsy.jpg',
        'men/white_beard.png',
        'men/white_masculine.jpg',
        // Add all men reference faces here
      ];
    
    //   useEffect(() => {
    //     if (showCamera && videoRef.current && !(videoRef.current as HTMLVideoElement).srcObject) {
    //       navigator.mediaDevices.getUserMedia({
    //         video: true,
    //         audio: false
    //       })
    //       .then(stream => {
    //         videoRef.current.srcObject = stream;
    //         setStream(stream);
    //       })
    //       .catch(err => {
    //         console.error('Camera error:', err);
    //         alert('Unable to access camera. Please make sure you have granted camera permissions.');
    //       });
    //     }
    //   }, [showCamera]);

    //   const takePhoto = async () => {
    //     if (videoRef.current && stream) {
    //       const canvas = document.createElement("canvas");
    //       canvas.width = videoRef.current.videoWidth;
    //       canvas.height = videoRef.current.videoHeight;
    //       const ctx = canvas.getContext("2d");
          
    //       // Flip the image horizontally for selfie mirror effect
    //       ctx.scale(-1, 1);
    //       ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
          
    //       const photoUrl = canvas.toDataURL("image/jpeg");
    //       setSelectedImage(photoUrl);
    //       setFormData(prev => ({ ...prev, selfieImage: photoUrl }));
    //       stopCamera();
    
    //       // Automatically get face type after taking photo
    //       try {
    //         // Convert base64 to blob
    //         const response = await fetch(photoUrl);
    //         const blob = await response.blob();
            
    //         // Create file from blob
    //         const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
            
    //         const formData = new FormData();
    //         formData.append("file", file);

    //         console.log(userId);
            
        
    //         const res = await fetch(`https://amoria-api-1087547623917.us-central1.run.app/classify-selfie?user_id=${userId}`, {
    //             method: "POST",
    //             body: formData,
    //           });
        
    //         const data = await res.json();
    //         console.log("Face Type:", data);
    //         setFormData(prev => ({
    //           ...prev,
    //           userFaceType: data
    //         }));
        
    //       } catch (error) {
    //         console.error("Error classifying face:", error);
    //         alert("Failed to analyze face type. Please try again.");
    //       }
    //     }
    //   };
    
      const getMBTI = (answers: any[]) => {
        const axisScores = {
          E: answers[0] + answers[1],
          I: 10 - answers[0] - answers[1],
      
          S: answers[2] + answers[3],
          N: 10 - answers[2] - answers[3],
      
          T: answers[4] + answers[5],
          F: 10 - answers[4] - answers[5],
      
          J: answers[6] + answers[7],
          P: 10 - answers[6] - answers[7],
        };
      
        const mbti =
          (axisScores.E >= axisScores.I ? "E" : "I") +
          (axisScores.S >= axisScores.N ? "S" : "N") +
          (axisScores.T >= axisScores.F ? "T" : "F") +
          (axisScores.J >= axisScores.P ? "J" : "P");
      
        return mbti;
      };

           
      const fetchAllMatches = async () => {
        try {
          const res = await fetch("https://amoria-api-1087547623917.us-central1.run.app/match-all");
          const data = await res.json();
      
          console.log("All Matches:", data);
      
          // Optional: Set to state if displaying
          // setMatchResults(data);
      
        } catch (err) {
          console.error("Failed to fetch all matches:", err);
        }
      };

      const handleSubmit = async () => {
        setIsLoading(true);
      
        try {
          const mbtiType = getMBTI(formData.personalityAnswers);
      
          const q = query(
            collection(db, "users"),
            where("phoneNumber", "==", formData.phoneNumber)
          );
          const snapshot = await getDocs(q);
      
          if (!snapshot.empty) {
            setIsLoading(false);
            alert("This phone number has already been used. Please use a different number.");
            return;
          }
      
          const newUserId = `user_${Date.now()}`;
      
          // 🔥 Upload selfie to Firebase Storage
          if (formData.selfieImage) {
            const blob = await (await fetch(formData.selfieImage)).blob();
            const downloadURL = await uploadUserPhoto(blob, newUserId);
            
            setFormData(prev => ({ ...prev, selfieImage: downloadURL as any }));
            // 🔥 Save the download URL to Firestore later in setDoc
          }
      
          const simpleData = {
            id: newUserId,
            data: {
              ...formData,
              mbti: mbtiType,
              selectedFaces: Array.from(selectedFaces).map((face) => {
                if (typeof face === 'string') {
                  return face
                    .replace(/^women\/|^men\//, '') // Remove "women/" or "men/"
                    .replace(/\.(jpg|jpeg|png)$/, '') // Remove extension
                    .replace(/_/g, ' '); // Replace underscores with spaces
                }
                return ''; // Return an empty string if face is not a string
              }),
              submittedAt: new Date().toISOString()
            }
          };
      
          await setDoc(doc(db, "users", simpleData.id), simpleData.data);
      
          
          localStorage.setItem('aiMatchmakerData', JSON.stringify(simpleData));
      
          setTimeout(() => {
            setIsLoading(false);
            setSubmitted(true);
            setUserDataExists(true)
            localStorage.setItem('aiMatchmakerSubmitted', 'true');
            window.location.reload();
          }, 3000);



      
        } catch (error) {
          console.error('Error:', error);
          setIsLoading(false);
          // alert('Failed to save data. Please try again.');
        }
      };
      
      
    //   const handleMatch = async () => {
       
    //     try {
    //       // Get the current user's ID from localStorage
    //       const storedData = localStorage.getItem('aiMatchmakerData');
    //       // if (!storedData) {
    //       //   alert('Please submit your profile first!');
    //       //   return;
    //       // }
    
    //       // Simplified location permission request
    //       if ("geolocation" in navigator) {
    //         setLocationStatus('waiting');
            
    //         // Directly request location permission
    //         navigator.geolocation.getCurrentPosition(
    //           // Success callback
    //           async (position) => {
    //             setUserLocation({
    //               lat: position.coords.latitude,
    //               lng: position.coords.longitude
    //             });
    //             setLocationStatus('active');
    
    //             // Start watching location
    //             const id = navigator.geolocation.watchPosition(
    //               (pos) => {
    //                 setUserLocation({
    //                   lat: pos.coords.latitude,
    //                   lng: pos.coords.longitude
    //                 });
    //               },
    //               (error) => {
    //                 console.error("Error watching location:", error);
    //                 setLocationStatus('error');
    //               },
    //               { enableHighAccuracy: true }
    //             );
    //             setWatchId(id);
    
    //             // After location is obtained, fetch matches
    //             const response = await fetch(`https://amoria-api-1087547623917.us-central1.run.app/match/user_1745062738828`);
    //             if (!response.ok) {
    //               throw new Error('Failed to fetch matches');
    //             }
    //             const matchData = await response.json();
    //             setMatchResults(matchData.matches);
    //             navigateToSection('location-direction');
    //           },
    //           // Error callback
    //           (error) => {
    //             console.error("Error getting location:", error);
    //             setLocationStatus('error');
    //             alert('Please enable location access to find matches near you.');
    //           },
    //           // Options
    //           {
    //             enableHighAccuracy: true,
    //             timeout: 5000,
    //             maximumAge: 0
    //           }
    //         );
    //       } else {
    //         setLocationStatus('error');
    //         alert('Location services are not available on your device.');
    //       }
    
    //     } catch (error) {
    //       console.error('Error getting matches:', error);
    //       alert('Failed to find matches. Please try again.');
    //     }
    //   };

  return (
    <div className={`${geistSans.className} ${geistMono.className} h-screen overflow-hidden`}>
        <div ref={containerRef} className="transition-transform duration-1000 ease-in-out">
            {showInitialLoading ? (
                <div className="flex flex-col items-center justify-center h-screen w-full">
                  <FaSpinner className="animate-spin text-4xl text-gray-500 dark:text-gray-300 mb-4" />
                  <span className="text-gray-600 dark:text-gray-300 text-lg">Loading...</span>
                </div>
            ) : userDataExists ? (
                <Matches />
            ) : (
                <>
                    {/* User Info Section */}
                    <section id="user-info" className="h-screen flex items-center p-4">
                        <div className="w-full max-w-4xl mx-auto px-4">
                            <h2 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center">Tell us about yourself</h2>
                            <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                <label className="block text-sm font-[family-name:var(--font-geist-mono)] mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="w-full p-3 rounded-lg bg-white dark:bg-black border font-[family-name:var(--font-geist-mono)] focus:border-2 focus:border-black dark:focus:border-white outline-none"
                                    placeholder="First name"
                                />
                                </div>
                                <div>
                                <label className="block text-sm font-[family-name:var(--font-geist-mono)] mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="w-full p-3 rounded-lg bg-white dark:bg-black border font-[family-name:var(--font-geist-mono)] focus:border-2 focus:border-black dark:focus:border-white outline-none"
                                    placeholder="Last name"
                                />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-[family-name:var(--font-geist-mono)] mb-2">
                                Age
                                </label>
                                <input
                                type="number"
                                min="18"
                                max="120"
                                value={formData.age}
                                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                                className="w-full p-3 rounded-lg bg-white dark:bg-black border font-[family-name:var(--font-geist-mono)] focus:border-2 focus:border-black dark:focus:border-white outline-none"
                                placeholder="Your age"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-[family-name:var(--font-geist-mono)] mb-2">
                                Gender
                                </label>
                                <select 
                                value={formData.gender}
                                onChange={(e) => {setFormData(prev => ({ ...prev, gender: e.target.value })); setGender(e.target.value)}}
                                className="w-full p-3 rounded-lg bg-white dark:bg-black border font-[family-name:var(--font-geist-mono)] focus:border-2 focus:border-black dark:focus:border-white outline-none"
                                >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-[family-name:var(--font-geist-mono)] mb-2">
                                Sexual Orientation
                                </label>
                                <select 
                                value={formData.sexualOrientation}
                                onChange={(e) => setFormData(prev => ({ ...prev, sexualOrientation: e.target.value }))}
                                className="w-full p-3 rounded-lg bg-white dark:bg-black border font-[family-name:var(--font-geist-mono)] focus:border-2 focus:border-black dark:focus:border-white outline-none"
                                >
                                <option value="">Select orientation</option>
                                <option value="straight">Straight</option>
                                <option value="gay">Gay</option>
                                <option value="lesbian">Lesbian</option>
                                <option value="bisexual">Bisexual</option>
                                <option value="pansexual">Pansexual</option>
                                <option value="asexual">Asexual</option>
                                <option value="other">Other</option>
                                </select>
                            </div>

                            <p className="text-sm text-center font-[family-name:var(--font-geist-mono)] text-gray-600 dark:text-gray-400">
                                All information is kept private and secure
                            </p>

                            <NavigationButtons />
                            
                            
                            </div>
                        </div>
                        </section>

                        {/* Personality Questions */}
                        {['I gain energy from social gatherings and enjoy being the center of attention.',
                        'I prefer spending time alone to recharge after social interactions.',
                        'I focus on facts and details rather than ideas and theories.',
                        'I enjoy interpreting abstract concepts and imagining future possibilities.',
                        'I prioritize logic and objective analysis when making decisions.',
                        "I consider people's feelings and values more than just facts when deciding.",
                        'I prefer structured plans and sticking to schedules.',
                        'I like to keep things open-ended and make decisions last-minute.',
                        'I adapt quickly to change and enjoy spontaneity.',
                        'I believe rules exist for a reason and should generally be followed.'
                        ].map((question, index) => (
                        <section 
                            key={`mbti${index + 1}`} 
                            id={`mbti${index + 1}`} 
                            className="h-screen flex items-center bg-black/[.05] dark:bg-white/[.06] p-4"
                        >
                            <div className="w-full max-w-4xl mx-auto px-4">
                            <h2 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center">Personality Assessment</h2>
                            
                            <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
                                <p className="text-lg sm:text-xl text-center font-[family-name:var(--font-geist-mono)]">
                                {index + 1}. {question}
                                </p>

                                <div className="space-y-4">
                                <div className="flex justify-between px-2 sm:px-4 text-xs sm:text-sm">
                                    <span className="font-[family-name:var(--font-geist-mono)]">Strongly Disagree</span>
                                    <span className="font-[family-name:var(--font-geist-mono)]">Strongly Agree</span>
                                </div>

                                <div className="flex justify-center gap-2 sm:gap-4">
                                    {[1, 2, 3, 4, 5].map((number) => (
                                    <button
                                        key={number}
                                        onClick={() => {
                                        setFormData(prev => ({
                                            ...prev,
                                            personalityAnswers: prev.personalityAnswers.map((ans, idx) => 
                                            idx === index ? number : ans
                                            )
                                        }));
                                        }}
                                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg border border-solid 
                                        transition-all duration-200 flex items-center justify-center 
                                        text-base sm:text-lg font-bold focus:outline-none 
                                        focus:ring-2 focus:ring-black dark:focus:ring-white group
                                        ${formData.personalityAnswers[index] === number 
                                            ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' 
                                            : 'hover:bg-black/[.05] dark:hover:bg-white/[.06] border-black/[.1] dark:border-white/[.1]'
                                        }`}
                                    >
                                        <span className={`group-hover:scale-110 transition-transform
                                        ${formData.personalityAnswers[index] === number 
                                            ? 'transform scale-110' 
                                            : ''
                                        }`}>
                                        {number}
                                        </span>
                                    </button>
                                    ))}
                                </div>

                                <div className="flex justify-center gap-2 sm:gap-4">
                                    {[1, 2, 3, 4, 5].map((number) => (
                                    <span key={number} className="w-14 sm:w-16 text-center text-xs font-[family-name:var(--font-geist-mono)] text-gray-600">
                                        {number}
                                    </span>
                                    ))}
                                </div>
                                </div>

                                <div className="text-center space-y-2">
                                <p className="font-[family-name:var(--font-geist-mono)] text-gray-600 dark:text-gray-400">
                                    Question {index + 1} of 10
                                </p>
                                <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                                    <div 
                                    className="h-1 bg-black dark:bg-white rounded-full" 
                                    style={{ width: `${(index + 1) * 10}%` }}
                                    ></div>
                                </div>
                                </div>

                                <NavigationButtons />
                            </div>
                        </div>
                        </section>
                    ))}

                      {isLoading && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                          <div className="bg-white dark:bg-black p-6 rounded-xl shadow-lg flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-gray-800 dark:border-white"></div>
                            <p className="text-black dark:text-white">Submitting...</p>
                          </div>
                        </div>
                      )}

                        {/* Face Preferences Section */}
                        <section id="face-preferences" className="h-screen flex items-center bg-black/[.05] dark:bg-white/[.06] p-4">
                        <div className="w-full max-w-4xl mx-auto px-4">
                            <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-4 text-center">Select Your Type</h2>
                            <p className="text-xs sm:text-sm text-center font-[family-name:var(--font-geist-mono)] mb-4 sm:mb-6 text-gray-600">
                            Choose all the faces that you find attractive
                            </p>

                            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto">
                            {/* Show opposite gender faces based on user's gender */}
                            {(formData.gender === 'male' ? womenFaces : menFaces).map((imageName) => (
                                <div 
                                key={imageName} 
                                className="relative aspect-square cursor-pointer group"
                                onClick={() => {
                                    setSelectedFaces(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(imageName)) {
                                        newSet.delete(imageName);
                                    } else {
                                        newSet.add(imageName);
                                    }
                                    return newSet;
                                    });
                                }}
                                >
                                <div className={`absolute inset-0 overflow-hidden rounded-lg transition-colors
                                    ${selectedFaces.has(imageName) 
                                    ? 'border-4 border-black dark:border-white' 
                                    : 'border border-transparent hover:border-black dark:hover:border-white'
                                    }`}>
                                    <div className={`absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-black 
                                    dark:border-white bg-white dark:bg-black transition-opacity z-10
                                    ${selectedFaces.has(imageName) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm sm:text-base">✓</span>
                                    </div>
                                    </div>
                                    <Image
                                        src={`/reference_faces/${imageName ?? ''}`}
                                        alt={
                                            imageName
                                                ? ((imageName.split('/').pop() || 'Image')
                                                    .replace('.jpg', '')
                                                    .replace('.png', '')
                                                    .replace(/_/g, ' '))
                                                : 'Image'
                                        }
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 33vw, 150px"
                                    />
                                </div>
                            </div>
                            ))}
                            </div>

                            <div className="mt-4 sm:mt-6 text-center">
                            <p className="text-xs sm:text-sm font-[family-name:var(--font-geist-mono)] text-gray-600 dark:text-gray-400 mb-1">
                                Selected: <span className="font-bold">{selectedFaces.size}</span> faces
                            </p>
                            <p className="text-xs font-[family-name:var(--font-geist-mono)] text-gray-500">
                                Click on images to select/deselect
                            </p>
                            </div>

                            <NavigationButtons />
                        </div>
                        </section>

                        <div id="recaptcha-container"></div>

                        {/* Selfie Upload Section */}
                        <section id="selfie-upload" className="h-screen flex items-center bg-black/[.05] dark:bg-white/[.06] p-4">
                        <div className="w-full max-w-4xl mx-auto px-4">
                            <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-4 text-center">Add Your Photo</h2>
                            <p className="text-xs sm:text-sm text-center font-[family-name:var(--font-geist-mono)] mb-4 sm:mb-6 text-gray-600 dark:text-gray-400">
                            Upload a clear photo of your face or take a selfie
                            </p>

                            <div className="max-w-lg mx-auto space-y-6">
                            {/* Preview Area */}
                            <div className="aspect-square w-48 sm:w-64 mx-auto relative rounded-lg border-2 border-dashed border-black/20 dark:border-white/20 overflow-hidden">
                                {selectedImage ? (
                        <Image
                                    src={selectedImage}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                                ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                )}
                            </div>

                            {/* Upload/Camera Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <label className="flex-1 cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const url = URL.createObjectURL(file);
                                        setSelectedImage(url as unknown as null);
                                        setFormData(prev => ({ ...prev, selfieImage: url as unknown as null }));
                                        
                                        // Automatically get face type after photo upload
                                        try {
                                        // Convert file to blob
                                        const response = await fetch(url);
                                        const blob = await response.blob();
                                        
                                        // Create file from blob
                                        const imageFile = new File([blob], "selfie.jpg", { type: "image/jpeg" });
                                        
                                        const formData = new FormData();
                                        formData.append("file", imageFile);

                                            console.log(gender);
                                            
                                        const res = await fetch(`https://amoria-api-1087547623917.us-central1.run.app/classify-selfie?gender=${gender}`, {
                                            method: "POST",
                                            body: formData,
                                          });
                                    
                                        const data = await res.json();
                                        console.log("Face Type:", data);
                                        setFormData(prev => ({
                                            ...prev,
                                            userFaceType: data
                                        }));
                                    
                                        } catch (error) {
                                        console.error("Error classifying face:", error);
                                        // alert("Failed to analyze face type. Please try again.");
                                        }
                                    }
                                    }}
                                />
                                <div className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] font-medium px-8 py-3 text-sm sm:text-base gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Upload Photo
                                </div>
                                </label>

                                {/* <button 
                                onClick={startCamera}
                                className="flex-1 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] font-medium px-8 py-3 text-sm sm:text-base gap-2"
                                >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Take Selfie
                                </button> */}
                            </div>

                            <p className="text-xs text-center font-[family-name:var(--font-geist-mono)] text-gray-500">
                                Choose a clear, well-lit photo of your face
                            </p>
                            </div>

                            <NavigationButtons />
                        </div>
                        </section>

                        {/* Submit Section */}
                        <section id="submit" className="h-screen flex items-center bg-black/[.05] dark:bg-white/[.06] p-4 relative">
                        <div className="w-full max-w-4xl mx-auto px-4">
                            <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-4 text-center">Thank You!</h2>
                            <p className="text-xs sm:text-sm text-center font-[family-name:var(--font-geist-mono)] mb-4 sm:mb-6 text-gray-600 dark:text-gray-400">
                            Leave us a message and we'll get back to you
                            </p>
                            <button 
                            onClick={handleSubmit}
                                className="w-full rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium px-8 py-3 text-sm sm:text-base"
                                >
                                Submit
                            </button>
                            {/* <button 
                            onClick={fetchAllMatches}
                            className="w-full rounded-full mt-3 border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium px-8 py-3 text-sm sm:text-base"
                            >
                            Match
                            </button> */}
                        </div>
                    </section>
                </>
            )}
        </div>
    </div>
  )
}

export default MbtiQuiz
