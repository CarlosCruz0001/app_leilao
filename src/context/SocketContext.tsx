import { ReactNode, createContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type SocketContextType = {
  supabase: typeof supabase;
};

const initialValue: SocketContextType = {
  supabase,
};

export const SocketContext = createContext(initialValue);

type Props = {
  children: ReactNode;
};

export const SocketContextProvider = ({ children }: Props) => {
  useEffect(() => {
    console.log("Supabase initialized.");

    const channel = supabase
      .channel("realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public" }, (payload) => {
        console.log("New data:", payload);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      console.log("Supabase unsubscribed.");
    };
  }, []);

  return (
    <SocketContext.Provider value={{ supabase }}>
      {children}
    </SocketContext.Provider>
  );
};