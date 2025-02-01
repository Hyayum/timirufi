import * as Tone from "tone";
import MidiWriter from "midi-writer-js";
import { ChordForUtils } from "@/chord/model";
import { fitRange, applyAccd } from "@/chord/utils";
import { basicScale, noteNames } from "@/chord/scale";

const toneSettings = {
  urls: ["F#2", "A2", "C3", "D#3", "F#3", "A3", "C4", "D#4", "F#4", "A4", "C5", "D#5"].reduce((obj, k) => ({
    ...obj,
    [`${k}`]: `${k.replace("#", "s")}.mp3`,
  }), {}),
  baseUrl: "https://tonejs.github.io/audio/salamander/",
};

const notesNumToName = (notes: number[]) => {
  return notes.map((n) => `${noteNames[n % 12]}${Math.floor(n / 12)}`);
};

const chordToNotes = (chord: ChordForUtils) => {
  const scale = applyAccd(basicScale, chord.accd || [], 1);
  const keyUd = fitRange(chord.key * 7, 0, 12);
  const bassNote12 = keyUd + scale[chord.bass - 1];
  const bassNote = fitRange(bassNote12, 29, 12); // bass 29(F1) ~ 40(E2)
  const highNotes = Array.from(chord.shape).map((n) => {
    const scaleIndex = fitRange(chord.bass + Number(n) - 2, 0, 7);
    const note12 = keyUd + scale[scaleIndex];
    return fitRange(note12, 53, 12); // high 53(F3) ~ 64(E4)
  });
  return notesNumToName([bassNote, ...highNotes]);
};

export const getChordPlayer = async () => {
  const synth = new Tone.Sampler(toneSettings).toDestination();
  await Tone.loaded();
  return async (chord: ChordForUtils) => {
    const length = chord.beats * 60 / chord.bpm;
    const notes = chordToNotes(chord);
    synth.triggerAttackRelease(notes, length + 0.1);
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve("end");
      }, length * 1000);
    });
  };
};

export const createMidi = (chords: ChordForUtils[]) => {
  const track = new MidiWriter.Track();
  let currentBpm = 0;
  for (const chord of chords) {
    if (chord.bpm != currentBpm) {
      currentBpm = chord.bpm;
      track.addEvent(new MidiWriter.TempoEvent({ bpm: chord.bpm }));
    }
    const notes = chordToNotes(chord);
    track.addEvent(new MidiWriter.NoteEvent({ pitch: notes, duration: `T${128 * chord.beats}`, velocity: 79 }));
  }
  return new MidiWriter.Writer(track).buildFile();
};