"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { auth } from "../../../../auth";
import axios from "axios";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: session } = useSession();
  console.log(session);

  const channelDetails = async () => {
    try {
      const response = await axios.get("/api/youtube/channel", {
        withCredentials: true,
      });
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching channel details", error);
    }
  };

  useEffect(() => {
    channelDetails();
  }, []);

  if (session?.user?.role === "youtuber") {
    return <p>You are an admin, welcome!</p>;
  }

  return <p>You are not authorized to view this page!</p>;
}
