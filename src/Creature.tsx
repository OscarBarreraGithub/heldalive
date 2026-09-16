/** Held is drawn on a small grid, from Oscar's two-antenna saucer sketch.
 * Motion belongs to the habitat; the same drawing is used at every size. */
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
      <g stroke="#465953" strokeWidth="4" strokeLinejoin="round">
        <path
          className="alien-antenna antenna-left"
          d="M40 38V28H36V20H32V16H20V20H16V28H22V22"
          strokeLinecap="round"
        />
        <path
          className="alien-antenna antenna-right"
          d="M80 38V28H84V20H88V16H100V20H104V28H98V22"
          strokeLinecap="round"
        />
        <path
          d="M38 86V108H28V114H48V94M72 94V114H92V108H82V86"
          fill="#A9BCAD"
        />
        <path
          d="M42 36H78V40H90V48H96V60H100V78H96V90H84V98H36V94H28V86H24V66H28V54H32V44H42Z"
          fill="#DCE9D1"
        />
      </g>
      <path
        d="M44 41H76V45H86V53H90V65H94V81H86V89H38V85H32V65H36V53H40V45H44Z"
        fill="#F1F3DC"
      />
      <path
        d="M28 72H32V84H40V91H84V87H92V81H97V87H93V90H83V96H37V92H30V85H28Z"
        fill="#C1D2BA"
      />
      {sleeping ? (
        <path
          d="M45 73H54M68 73H77"
          stroke="#465953"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ) : (
        <g className="alien-eyes" fill="#465953">
          <path d="M47 52H52V60H51V80H46V68H47Z" />
          <path d="M70 51H75V83H70Z" />
        </g>
      )}
      <path d="M36 108H43M78 108H85" stroke="#EDF0DB" strokeWidth="3" />
    </svg>
  );
}
