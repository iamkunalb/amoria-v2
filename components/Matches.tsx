'use client'

import React, { useEffect, useState } from 'react'
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
  

//   const fetchAllMatches = async () => {
//     try {
//     //   const res = await fetch("https://amoria-api.onrender.com/match-all");
//     //   const data = await res.json();

//       const res = await fetch("https://amoria-api.onrender.com/match-rounds");
//         const data = await res.json();
//         console.log(data);
        
//       const userId = await getUserDocumentId();
//     //   const matchedUsers = data[userId] || [];

//     const roundMatches = data[userId] || [];
    
//     // const round1 = roundMatches[0] || null;
//     // const round2 = roundMatches[1] || null;
//     // const round3 = roundMatches[2] || null;
//     setAllRounds(roundMatches);
//     console.log(roundMatches);
    
//     setRoundIndex(0); // start from round 0

//     // Set initial round to display
//     const initialRound = roundMatches[0] || [];

//     const storage = getStorage();
//     const enhancedMatches = await Promise.all(
//     initialRound.map(async (match: { id: any }) => {
//         try {
//         const fileRef = ref(storage, `user_photos/${match.id}.jpg`);
//         const url = await getDownloadURL(fileRef);
//         return { ...match, avatar: url };
//         } catch (e) {
//         console.warn(`No avatar for ${match.id}, using default`);
//         return { ...match, avatar: "/avatars/default.jpg" };
//         }
//     })
//     );

//     setMatches(enhancedMatches);
//     setHasFetchedMatches(true);

//       console.log();
      
  
//       const name = await getUserFirstNameByPhone();
//       setFirstName(name);
  
//     } catch (err) {
//       console.error("Failed to fetch all matches:", err);
//     }
//   };
const fetchAllMatches = async () => {
    try {
      const res = await fetch("https://amoria-api.onrender.com/match-rounds");
      const data = await res.json();

      console.log(data);
      

      const userId = await getUserDocumentId();
  
      const rounds = ["round_1", "round_2", "round_3"];

      const userRounds = rounds.map((roundKey) => {
        const roundPairs = data[roundKey] || [];
        const matchObj = roundPairs.find((pair: any) => userId in pair);
        return matchObj ? matchObj[userId] : null;
      }).filter(Boolean); // Filter out nulls
  
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
  
      setAllRounds(enhanced);  // store all round matches
      setMatches([enhanced[0]]);  // only show first match
      setHasFetchedMatches(true);
      setRoundIndex(0);
  
      const name = await getUserFirstNameByPhone();
      setFirstName(name);
    } catch (err) {
      console.error("Failed to fetch all matches:", err);
    }
  };
  

  const loadNextRound = () => {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= allRounds.length) return;
  
    setMatches([allRounds[nextIndex]]);
    setRoundIndex(nextIndex);
  };
  
  
  

  useEffect(() => {

    const fetchMatches = async () => {
      try {
        const auth = getAuth();
        const db = getFirestore();
        const user = auth.currentUser;
        if (!user) return;

        const userID = ""
        
        const userId = getUserDocumentId()
        // console.log(user);
        

        // Example: Fetch matches where userId == current user's id
        // Adjust the query as per your Firestore structure
        const q = query(
          collection(db, "matches"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const fetchedMatches = snapshot.docs.map(doc => doc.data());

        // setMatches(fetchedMatches);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  useEffect(() => {
    fetchAllMatches();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
        Showing match for <span className="font-medium">Round {roundIndex + 1}</span>
        </p>
      <h2 className="text-2xl font-bold mb-2 text-center text-black dark:text-white">
        Your Matches, {firstName}
      </h2>
      <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
        Based on your profile and preferences
      </p>
      {loading ? (
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <div className="flex flex-wrap gap-4 justify-center">
          {matches.map((match, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-neutral-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-4 w-64 flex flex-col items-center"
            >
              <div className="flex items-center w-full mb-2">
                <div className="relative w-12 h-12 mr-3">
                  <Image
                    src={match.avatar || "/avatars/default.jpg"}
                    alt={match.name}
                    fill
                    className="rounded-full object-cover border border-gray-300 dark:border-gray-700"
                    sizes="48px"
                  />
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-semibold px-2 py-0.5 rounded shadow">
                    {Math.round(match.score / 6 * 100)}%
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-black dark:text-white">{match.name}</h3>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-mono">
                  {match.mbti}
                </span>
                <span className="text-gray-400 text-xs">|</span>
                <span className="text-gray-600 dark:text-gray-300 text-xs">{match.age} yrs</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">{match.bio}</p>
              <button
                className="w-full rounded border border-black dark:border-white text-black dark:text-white text-xs py-1 mt-auto hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
                onClick={() => setSelectedMatch(match)}
              >
                View Profile
              </button>
            </div>
          ))}
          

          {/* {!hasFetchedMatches && ( */}
            {/* <button 
              onClick={fetchAllMatches}
              className="w-full rounded-full mt-3 border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium px-8 py-3 text-sm sm:text-base"
            >
              Match
            </button> */}
          {/* )} */}
        </div>
        
      )}

      {/* Modal */}
      {selectedMatch && (
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
      )}

        {  roundIndex < allRounds.length - 1 && (
            <button
                onClick={loadNextRound}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Next Round
            </button>
            )}
        <button 
                onClick={() => auth.signOut()}
                className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium h-10 w-50 mt-10"
        >
            Sign Out
        </button>   
      
    </div>
  )
}

export default Matches
