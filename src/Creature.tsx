import { useEffect, useId, useState } from "react";
import type { Phase } from "../shared/protocol";
export function LittleHeld({
  sleeping = false,
  mini = false,
}: {
  sleeping?: boolean;
  mini?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={mini ? "mini-held" : "little-held"}
    >
      <path d="M54 26V14H64V26M64 14V6H76V14" fill="#59866B" />
      <path
        d="M40 30H80V38H92V50H100V84H88V94H76V102H44V94H32V84H22V58H30V42H40V30Z"
        fill="#ABCFB2"
      />
      <path
        d="M40 38H80V46H88V58H94V82H84V90H38V82H30V58H38V46H40Z"
        fill="#CBE5C8"
      />
      <path d="M32 88H46V104H26V96H32ZM78 88H92V96H98V104H78Z" fill="#7B9E85" />
      {sleeping ? (
        <path d="M42 62H52M68 62H78" stroke="#283E34" strokeWidth="5" />
      ) : (
        <>
          <rect x="43" y="56" width="8" height="13" rx="3" fill="#283E34" />
          <rect x="70" y="56" width="8" height="13" rx="3" fill="#283E34" />
        </>
      )}
      <path d="M55 73H65V78H55Z" fill="#283E34" />
      <path d="M32 72H44M78 72H90" stroke="#E5A494" strokeWidth="5" />
    </svg>
  );
}
export function Creature({
  phase,
  helpers,
  workers,
  studio = false,
  edition = 6,
}: {
  phase: Phase;
  helpers: number;
  workers: number;
  studio?: boolean;
  edition?: number;
}) {
  const [greeting, setGreeting] = useState(false);
  const id = useId().replaceAll(":", "");
  const asleep = phase === "sleeping" || phase === "waiting";
  const thinking = phase === "thinking";
  useEffect(() => {
    if (greeting) {
      const timer = setTimeout(() => setGreeting(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [greeting]);
  return (
    <div
      className={`creature-stage edition-${edition} ${asleep ? "is-sleeping" : "is-awake"} ${thinking ? "is-thinking" : ""} ${greeting ? "is-greeting" : ""}`}
    >
      <span className="handwritten creature-note">
        small mind.
        <br />
        big little world.
        <svg viewBox="0 0 70 55" aria-hidden="true">
          <path d="M7 4C58 0 64 18 34 45m0 0 2-15m-2 15 15-2" />
        </svg>
      </span>
      <div className="stage-spark spark-one" aria-hidden="true">
        ✳
      </div>
      <div className="stage-spark spark-two" aria-hidden="true">
        ✧
      </div>
      <svg
        className="pet-device"
        viewBox="0 0 490 490"
        role="img"
        aria-label={`Held, a little mint-green pixel creature with a sprout. ${asleep ? "Resting until all its model pieces are present." : thinking ? "Working on a project." : "Taking a little breath."}`}
      >
        <defs>
          <linearGradient
            id={`${id}-shell`}
            x1="60"
            y1="20"
            x2="390"
            y2="480"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFB495" />
            <stop offset="0.52" stopColor="#F29A7D" />
            <stop offset="1" stopColor="#D97360" />
          </linearGradient>
          <linearGradient
            id={`${id}-screen`}
            x1="100"
            y1="90"
            x2="380"
            y2="380"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#EAF0D9" />
            <stop offset="1" stopColor="#C8D6B1" />
          </linearGradient>
          <pattern
            id={`${id}-grid`}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M8 0H0V8"
              fill="none"
              stroke="#718567"
              strokeOpacity=".07"
              strokeWidth="1"
            />
          </pattern>
          <filter
            id={`${id}-shadow`}
            x="-30%"
            y="-25%"
            width="170%"
            height="170%"
          >
            <feDropShadow
              dx="0"
              dy="16"
              stdDeviation="13"
              floodColor="#83627F"
              floodOpacity=".19"
            />
          </filter>
          <clipPath id={`${id}-clip`}>
            <rect x="96" y="115" width="298" height="238" rx="27" />
          </clipPath>
        </defs>
        <ellipse
          cx="247"
          cy="461"
          rx="125"
          ry="12"
          fill="#756077"
          opacity=".08"
        />
        <g filter={`url(#${id}-shadow)`}>
          <path
            d="M66 145C70 54 119 26 245 27C373 26 421 62 425 145L437 308C438 407 383 453 245 456C111 454 54 408 54 311Z"
            fill="#C86C5C"
          />
          <path
            d="M61 141C65 53 116 21 241 22C365 20 415 55 420 141L431 299C433 391 382 442 241 445C108 443 49 397 49 302Z"
            fill={`url(#${id}-shell)`}
            stroke="#C77764"
            strokeWidth="1.5"
          />
          {edition >= 5 && (
            <path
              d="M69 143C75 70 111 40 211 35"
              fill="none"
              stroke="#FFCFBA"
              strokeWidth="5"
              strokeLinecap="round"
              opacity=".8"
            />
          )}
          <rect x="78" y="99" width="334" height="272" rx="43" fill="#B9695A" />
          <rect
            x="84"
            y="104"
            width="322"
            height="257"
            rx="35"
            fill="#E9C1A5"
          />
          <rect
            x="96"
            y="115"
            width="298"
            height="238"
            rx="27"
            fill={`url(#${id}-screen)`}
          />
          <g clipPath={`url(#${id}-clip)`}>
            <rect
              x="96"
              y="115"
              width="298"
              height="238"
              fill={`url(#${id}-grid)`}
            />
            <path
              d="M96 304H120V296H136V304H166V298H184V306H238V300H260V306H324V298H350V305H394V353H96Z"
              fill="#ADC397"
              opacity=".48"
            />
            <path
              d="M118 331H143M331 320H352M163 342H173"
              stroke="#889F78"
              strokeWidth="3"
              opacity=".6"
            />
            {edition >= 4 && (
              <g className="pixel-clouds" fill="#F7F7E8" opacity=".7">
                <path d="M124 166H132V158H148V166H158V174H124Z" />
                <path d="M331 190H340V182H355V190H367V198H331Z" />
              </g>
            )}
            <text x="115" y="143" className="screen-caption">
              HELD / 001
            </text>
            <g
              transform="translate(344 131)"
              fill="none"
              stroke="#637B58"
              strokeWidth="2"
            >
              <rect width="26" height="10" rx="2" />
              <path d="M28 3v4" />
              {[0, 1, 2].map((i) => (
                <rect
                  key={i}
                  x={3 + i * 7}
                  y="3"
                  width="4"
                  height="4"
                  fill={!asleep || i === 0 ? "#637B58" : "none"}
                  stroke="none"
                />
              ))}
            </g>
            <ellipse
              className="pet-shadow"
              cx="243"
              cy="303"
              rx="56"
              ry="9"
              fill="#779366"
              opacity=".23"
            />
            <g className="pet-body" transform="translate(153 159)">
              {edition >= 2 && (
                <g className="pet-sprout">
                  <path d="M87 39V18H98V39" fill="#659077" />
                  <path
                    d="M91 21H72V10H83V15H91ZM98 14V4H117V14Z"
                    fill="#7DA286"
                  />
                  <path d="M98 4H111V9H98Z" fill="#A9C99F" />
                </g>
              )}
              <path
                d="M58 40H120V50H140V66H151V84H161V120H151V138H134V149H48V139H32V124H22V88H32V70H43V50H58Z"
                fill="#58765B"
                opacity=".25"
                transform="translate(2 5)"
              />
              <path
                d="M58 36H120V46H138V61H150V79H160V115H151V132H132V145H47V135H30V119H21V84H31V65H43V46H58Z"
                fill="#95BC9C"
              />
              <path
                d="M59 44H118V54H134V70H143V87H151V112H141V127H125V136H49V126H38V111H30V87H40V69H50V54H59Z"
                fill="#B9D8B5"
              />
              <path
                d="M58 46H113V53H58ZM46 59H56V78H46ZM38 83H45V101H38Z"
                fill="#DBEACB"
              />
              {edition >= 4 && (
                <g className="pet-feet" fill="#658F76">
                  <path d="M48 135H67V154H40V146H48Z" />
                  <path d="M114 135H132V146H140V154H114Z" />
                </g>
              )}
              <g className="pet-face">
                {asleep && !greeting ? (
                  <g stroke="#304D3D" strokeWidth="5" strokeLinecap="round">
                    <path d="M59 91h13M108 91h13" />
                    <path d="M84 107h9" strokeWidth="4" />
                  </g>
                ) : (
                  <>
                    <g
                      className={edition >= 3 ? "pet-eyes" : ""}
                      fill="#304D3D"
                    >
                      <rect x="62" y="78" width="10" height="17" rx="4" />
                      <rect x="109" y="78" width="10" height="17" rx="4" />
                      <rect
                        x="64"
                        y="79"
                        width="3"
                        height="4"
                        rx="1"
                        fill="#E5EEDA"
                      />
                      <rect
                        x="111"
                        y="79"
                        width="3"
                        height="4"
                        rx="1"
                        fill="#E5EEDA"
                      />
                    </g>
                    {greeting ? (
                      <path
                        d="M80 101H99V110H94V114H85V110H80Z"
                        fill="#304D3D"
                      />
                    ) : (
                      <path
                        d="M80 101v5h7v4h6v-4h7v-5"
                        fill="none"
                        stroke="#304D3D"
                        strokeWidth="3"
                      />
                    )}
                  </>
                )}
                {edition >= 2 && (
                  <g fill="#DDA18F" opacity=".8">
                    <rect x="46" y="98" width="17" height="6" rx="2" />
                    <rect x="121" y="98" width="17" height="6" rx="2" />
                  </g>
                )}
              </g>
              {edition >= 4 && (
                <path
                  className="pet-arm"
                  d="M148 103h15v-9h9v20h-24"
                  fill="#91B69A"
                />
              )}
            </g>
            {asleep && !greeting ? (
              <g className="sleep-marks" fill="#738468">
                <text x="295" y="221" fontSize="15">
                  z
                </text>
                <text x="315" y="200" fontSize="21">
                  z
                </text>
                <text x="337" y="174" fontSize="27">
                  z
                </text>
              </g>
            ) : (
              <g className="thinking-spark" fill="#7C8D65">
                <path d="M318 202v-8h7v8h8v7h-8v8h-7v-8h-8v-7Z" />
              </g>
            )}
            <text x="245" y="337" textAnchor="middle" className="screen-state">
              {greeting
                ? "oh, hello you!"
                : asleep
                  ? "a little nap…"
                  : thinking
                    ? "an idea is growing"
                    : "a moment to just be"}
            </text>
          </g>
          <text x="243" y="77" textAnchor="middle" className="device-label">
            held alive
          </text>
          <circle cx="158" cy="401" r="16" fill="#AD655C" />
          <circle cx="158" cy="398" r="15" fill="#F2C59F" />
          <circle cx="245" cy="405" r="20" fill="#AA645C" />
          <circle cx="245" cy="402" r="19" fill="#DDE4B6" />
          <path
            d="M240 402h10M245 397v10"
            stroke="#84936E"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="332" cy="401" r="16" fill="#AD655C" />
          <circle cx="332" cy="398" r="15" fill="#F2C59F" />
          <path
            d="M149 397h18M328 394h8v8h-8z"
            stroke="#BE8B71"
            strokeWidth="1.5"
            fill="none"
          />
        </g>
      </svg>
      <button
        className="pet-interaction"
        onClick={() => setGreeting(true)}
        aria-label="Say hello to Held"
        title="A little hello. This animation does not send a prompt."
      />
      <div className="pet-name-tag">
        <span className={`live-dot ${asleep ? "rest" : ""}`} />
        <span>
          <strong>held</strong>
          <span>
            {greeting
              ? "a little hello, just for you"
              : asleep
                ? "resting, not forgotten"
                : thinking
                  ? "making a little something"
                  : "awake & quietly curious"}
          </span>
        </span>
        <span className="tag-number">001</span>
      </div>
      {edition >= 6 && helpers > 0 && (
        <div className="helper-bubble">
          <LittleHeld mini />
          <span>
            {helpers} {helpers === 1 ? "mind" : "minds"} at work
          </span>
        </div>
      )}
      <div className="device-footnote">
        {studio
          ? "a rehearsal, powered by the artist’s Mac"
          : workers > 0
            ? `${workers} ${workers === 1 ? "browser is" : "browsers are"} lending a little life`
            : "a little mind, waiting for its pieces"}
      </div>
    </div>
  );
}
