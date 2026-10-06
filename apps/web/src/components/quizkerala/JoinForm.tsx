"use client";

import { useState } from "react";
import { QUIZKERALA } from "@/lib/quizkerala/content";

/**
 * "Have a code?" box on the home page. Sends the player straight to the
 * quiz's join link on the app, /q/<CODE>. Codes are letters and digits only,
 * so anything else typed is dropped rather than sent.
 */
export function JoinForm() {
  const [code, setCode] = useState("");
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

  return (
    <form
      className="join-box"
      onSubmit={(e) => {
        e.preventDefault();
        if (clean.length >= 4) {
          window.location.href = `${QUIZKERALA.appUrl}/q/${clean}`;
        }
      }}
    >
      <label htmlFor="qk-code" className="skip-link">
        Quiz code
      </label>
      <input
        id="qk-code"
        name="code"
        inputMode="text"
        autoComplete="off"
        placeholder="Enter quiz code"
        value={clean}
        onChange={(e) => setCode(e.target.value)}
        aria-describedby="qk-code-help"
      />
      <button className="btn btn-gold" type="submit" disabled={clean.length < 4}>
        Join quiz
      </button>
      <span id="qk-code-help" className="skip-link">
        Codes are 4 to 8 letters or numbers, for example ABC123.
      </span>
    </form>
  );
}
