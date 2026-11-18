// English twin of tr.ts (VIGIL.md 10): a faithful translation, nothing added and nothing left out.
import type { Content } from "./tr";

export const EN: Content = {
  afterQuake: [
    "Check yourself and the people with you. Put on shoes; there may be broken glass on the floor.",
    "Shut off the gas, electricity and water valves. Do not strike matches or lighters.",
    "Take your bag, go down the stairs (do not use the elevator) and head to an open assembly area. Aftershocks are to be expected.",
  ],
  afterQuakeNote: "Do not make phone calls; use messages and the internet. Call 112 only in an emergency.",
  feltMaybe: [
    "Check your home for a gas smell, new cracks or damage.",
    "There may be an aftershock; keep away from things that could fall over.",
    "Follow the official statement from AFAD. Do not tie up the phone lines.",
  ],
  nearPlant: [
    "This link is not a damage report. Nuclear plants shut down automatically in strong shaking.",
    "Follow the official statement: AFAD, the Nuclear Regulatory Authority (NDK), IAEA.",
    "Only if an official instruction comes: stay indoors, close doors and windows, turn off ventilation. Do not take iodine tablets without an official instruction.",
  ],
  tsunami: [
    "Move away from the shore at once: go at least 30 metres up or 3 kilometres inland.",
    "Do not wait for an official warning. Strong and long shaking, or the sea suddenly drawing back, is a warning in itself.",
    "The first wave may not be the largest. Do not return to the shore until an official \"all clear\" is given.",
  ],
  tsunamiNote: "This advice is rule based; it is not an official tsunami warning.",
  comms: {
    call112: "112 — emergency call.",
    radio: "Battery radio: TRT Radyo 1 / TRT FM. The frequency depends on the city;",
    radioFreq: "save your frequency in Alert",
    pmr: "PMR446 Channel 1 (446.00625 MHz): licence-free handheld radio. It is not an official emergency channel; it is for talking to people nearby. In a city the range is a few hundred metres to a few kilometres.",
    amateur: "145.500 MHz: amateur radio VHF calling frequency. Listening is allowed; transmitting needs a licence.",
  },
  chokepointNotes: {
    hormuz: { name: "Hormuz", text: "A large share of the oil and LNG moved by sea passes through here. A long disruption raises oil and natural gas prices; in Türkiye the effect shows in fuel and energy costs within weeks.", evidence: "B — plausible projection" },
    suez: { name: "Suez", text: "The main passage of the container route between Asia and Europe. If it closes, ships go around the Cape of Good Hope; the trip gets about 10–14 days longer and freight rates and delivery times rise. Türkiye's imports from Asia are directly affected.", evidence: "B — plausible projection" },
    mandeb: { name: "Bab-el-Mandeb", text: "The southern gate of Suez. A disruption here also lowers Suez traffic; the effect is the same as for Suez.", evidence: "B — plausible projection" },
    malacca: { name: "Malacca", text: "The energy and industrial supply line of East Asia. The effect on Türkiye is indirect: prices and delivery times of electronics and intermediate goods.", evidence: "C — indirect effect" },
    panama: { name: "Panama", text: "The route between Asia and the US east coast. Passage is restricted in drought periods. The effect on Türkiye is limited.", evidence: "C — indirect effect" },
    bosporus: { name: "Istanbul Strait", text: "The exit gate for Black Sea grain and oil. A disruption directly affects regional trade and Istanbul.", evidence: "B — plausible projection" },
  },
  conflictNote: "VigilRadar gives no personal safety instructions for conflict events. Follow the official sources.",
  nothingToDo: "There is nothing you need to do.",
  disclaimer: "Vigil is not an official warning system and gives no early warning. Data reaches us from official networks within minutes; there may be delays and errors. In an emergency call 112 and follow AFAD's statements.",
};
