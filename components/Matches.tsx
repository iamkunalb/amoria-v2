'use client'

import React, { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { userAgent } from 'next/server';
import { getStorage, ref, getDownloadURL } from "firebase/storage";


const auth = getAuth();
const db = getFirestore();

function Matches() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allMatches, setAllMatches] = useState();
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [hasFetchedMatches, setHasFetchedMatches] = useState(false);
  const [firstName, setFirstName] = useState("User");
  const [allRounds, setAllRounds] = useState<{ id: string }[][]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const initializedRef = useRef(false);

  const getUserDocumentId = async () => {
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
      throw new Error("No matching user found in Firestore");
    }
  
    const doc = snapshot.docs[0];
    const docId = doc.id; // 🔥 THIS is the Firestore document ID
    const userData = doc.data(); // You can also grab user data here
  
    return docId;
  };

  const getUserFirstNameByPhone = async () => {
    const user = auth.currentUser;
  
    if (!user || !user.phoneNumber) {
      throw new Error("User not logged in or missing phone number");
    }
  
    const q = query(
      collection(db, "users"),
      where("phoneNumber", "==", user.phoneNumber)
    );
  
    const snapshot = await getDocs(q);
  
    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      return userData.firstName || "Unknown";
    }
  
    return "Not found";
  };
  

const fetchAllMatches = async () => {
    console.log("Starting fetchAllMatches");
    try {
      const res = await fetch("https://amoria-api-1087547623917.us-central1.run.app/match-rounds");
      console.log("API response received");
      
      const data = await res.json();
      console.log("Data parsed:", data);

      const userId = await getUserDocumentId();
      console.log("User ID:", userId);
  
      const rounds = ["round_1", "round_2", "round_3"];

      const userRounds = rounds.map((roundKey) => {
        const roundPairs = data[roundKey] || [];
        const matchObj = roundPairs.find((pair: any) => userId in pair);
        return matchObj ? matchObj[userId] : null;
      }).filter(Boolean); // Filter out nulls
      
      console.log("User rounds:", userRounds);
  
      // Load avatars for round 0
      const storage = getStorage();
      
      const enhanced = await Promise.all(
        userRounds.map(async (match: any) => {
          try {
            const fileRef = ref(storage, `user_photos/${match.id}.jpg`);
            const url = await getDownloadURL(fileRef);
            return { ...match, avatar: url };
          } catch {
            return { ...match, avatar: "/avatars/default.jpg" };
          }
        })
      );
  
      console.log("Enhanced matches:", enhanced);
      setAllRounds(enhanced);  // store all round matches
      setMatches([enhanced[0]]);  // only show first match
      setHasFetchedMatches(true);
      setRoundIndex(0);
  
      const name = await getUserFirstNameByPhone();
      setFirstName(name);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch all matches:", err);
      setLoading(false);
    }
};
  

  const loadNextRound = () => {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= allRounds.length) return;
  
    setMatches([allRounds[nextIndex]]);
    setRoundIndex(nextIndex);
  };
  
  
  

  useEffect(() => {
    console.log("Component mounted");
    
    if (initializedRef.current) {
      console.log("Already initialized, skipping");
      return;
    }

    const initializeMatches = async () => {
      try {
        setLoading(true);
        await fetchAllMatches();
        initializedRef.current = true;
      } catch (error) {
        console.error("Error in initializeMatches:", error);
        setLoading(false);
      }
    };

    initializeMatches();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="h-screen flex flex-col items-center p-5 bg-white dark:bg-black">
      {/* <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
        Based on your profile and preferences
        </p> */}
      {loading ? (
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
          <div className="overflow-hidden">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
              Showing match for <span className="font-medium">Round {roundIndex + 1}</span>
            </p>
            <h2 className="text-2xl font-bold mb-5 text-center text-black dark:text-white">
              {firstName} x {matches[0]?.name}
            </h2>
            <div className="flex-1 w-full overflow-y-auto">
              <div className="flex justify-center">
                {matches.map((match, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedMatch(match)}
                    className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow flex flex-col"
                  >
                    <div className="relative h-96 w-full flex-shrink-0">
                      <Image
                        src={match.avatar || "/avatars/default.jpg"}
                        alt={match.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 384px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="text-3xl font-bold text-white mb-2">{match.name}</h3>
                        <div className="flex items-center gap-3">
                          <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-mono">
                            {match.mbti}
                          </span>
                          <span className="text-white/90 text-sm">{match.age} years old</span>
                          <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {Math.round(match.score / 8 * 100)}% Match
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      <div className="p-6">
                        <p className="text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{match.bio}</p>

                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 space-y-4">
                          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="text-pink-500">💘</span> Why You Match
                          </h4>
                          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            <p className="italic">
                              You and your match are a rare kind of pairing: two driven, emotionally intelligent people who are both structured and spontaneous, logical and empathetic. On paper, you might look like classic ESTJs — but your answers reveal something deeper: you're both balanced hybrids who know how to lead, listen, and love.
                            </p>
                            
                            <div className="space-y-3">
                              <h5 className="font-medium text-gray-700 dark:text-gray-300">Here's what makes your connection stand out:</h5>
                              
                              <div className="space-y-3">
                                <div className="flex gap-3">
                                  <span className="text-pink-500 mt-1">•</span>
                                  <p>You speak the same language — both of you value tradition, loyalty, and doing things the "right way." You believe in showing up, following through, and building something real.</p>
                                </div>
                                
                                <div className="flex gap-3">
                                  <span className="text-pink-500 mt-1">•</span>
                                  <p>You're natural planners — who also know how to break the rules. You love structure and reliability, but you're not afraid to throw the plan out the window and do something spontaneous when the moment calls for it.</p>
                                </div>
                                
                                <div className="flex gap-3">
                                  <span className="text-pink-500 mt-1">•</span>
                                  <p>You're both socially adaptable. You enjoy being around people, but also know when it's time to pull back and recharge. That means your relationship will feel exciting, but never exhausting.</p>
                                </div>
                                
                                <div className="flex gap-3">
                                  <span className="text-pink-500 mt-1">•</span>
                                  <p>You blend logic with emotional insight. You think through decisions carefully, but you also consider how they'll affect the people around you. That kind of mutual empathy is rare — and powerful.</p>
                                </div>
                              </div>
                            </div>

                            <div className="pt-2">
                              <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Most importantly:</p>
                              <p>You share a worldview. You both believe in order, commitment, and shared values. That's the foundation strong, lasting relationships are built on.</p>
                            </div>

                            <p className="italic text-gray-700 dark:text-gray-300 pt-2">
                              This isn't just a personality match — it's a compatibility built on shared values, mutual respect, and the potential to grow together. You don't just get each other. You elevate each other.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Modal */}
      {/* {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-sm w-full mx-4 relative flex flex-col items-center">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-black dark:hover:text-white text-2xl"
              onClick={() => setSelectedMatch(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="w-full flex flex-col items-center p-6">
              <div className="relative w-40 h-40 mb-4">
                <Image
                  src={selectedMatch.avatar || "/avatars/default.jpg"}
                  alt={selectedMatch.name}
                  fill
                  className="rounded-xl object-cover border border-gray-300 dark:border-gray-700"
                  sizes="160px"
                />
              </div>
              <div className="w-full text-center">
                <h3 className="text-2xl font-bold text-black dark:text-white mb-1">{selectedMatch.name}</h3>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-mono">
                    {selectedMatch.mbti}
                  </span>
                  <span className="text-gray-400 text-xs">|</span>
                  <span className="text-gray-600 dark:text-gray-300 text-xs">{selectedMatch.age} yrs</span>
                  <span className="text-gray-400 text-xs">|</span>
                  <span className="bg-black text-white text-xs font-semibold px-2 py-0.5 rounded shadow">
                    {Math.round(selectedMatch.score / 6 * 100)}%
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{selectedMatch.bio}</p>
                <button className="w-full rounded bg-black text-white dark:bg-white dark:text-black text-base py-2 font-semibold hover:opacity-90 transition">
                  Find
                </button>
              </div>
            </div>
          </div>
          
        </div>
      )} */}

        {/* {  roundIndex < allRounds.length - 1 && (
            <button
                onClick={loadNextRound}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Next Round
            </button>
            )} */}
            {/* <button 
              onClick={fetchAllMatches}
              className="w-full rounded-full mt-3 border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium px-8 py-3 text-sm sm:text-base"
            >
              Match
            </button> */}
        {/* <button 
                onClick={() => auth.signOut()}
                className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium h-10 w-50 mt-10"
        >
            Sign Out
        </button>    */}
      
    </div>
  )
}

export default Matches
