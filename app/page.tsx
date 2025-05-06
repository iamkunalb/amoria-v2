'use client'

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { auth } from "@/firebase";
import { signOut } from "@firebase/auth";
import Link from "next/link";
import router from "next/router";
import { useEffect } from "react";
import Login from "../app/login/page"
import MbtiQuiz from "@/components/MbtiQuiz";

export default function Home() {
  const {user} = useAuth();

    if (!user) {
      return <Login />
    }

  return (
    <div className="">
      <main className="">
        {user ? (
            // <p>{user?.uid}</p>
            <MbtiQuiz/>
          ):(
            <p>Not logged in bitch</p>
          )
        }
        {/* {user ? (
            <Button onClick={() => signOut(auth)} className="mt-10">
              Sign Out
            </Button>
          ):(
            <Link href="/login">
              <Button className="mt-10">
                Sign In
              </Button>
            </Link>
          )
        } */}

      </main>
    </div>
  );
}
