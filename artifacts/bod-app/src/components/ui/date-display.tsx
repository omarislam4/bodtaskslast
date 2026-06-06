import { useLang } from "@/contexts/LangContext";
import { formatDate } from "@/lib/date";
import React from "react";

type Props = {
  fmt?: string;
  date: Date | string;
};

export default function DateDisplay({ fmt = "MMMMMM d, yyyy", date }: Props) {
  const { lang } = useLang();
  return <span>{formatDate(date, fmt, lang)}</span>;
}
