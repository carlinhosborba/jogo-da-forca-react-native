// app/index.tsx
// Jogo da Forca — React Native + Expo
// Autor: Carlos Borba

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, StatusBar, TextInput } from "react-native";
import { Svg, Line, Circle } from "react-native-svg";

const MAX_ERRORS = 6; // cabeça, tronco, 2 braços, 2 pernas
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Lista de palavras
const WORDS = [
  "REACT","JAVASCRIPT","MOBILE","ANDROID","IOS","COMPONENTE","ESTADO","PROPRIEDADE",
  "NAVEGACAO","JOGO","FORCA","EXPO","NATIVO","INTERFACE","TECLADO","TENTATIVAS",
  "ALGORITMO","FUNCAO","OBJETO","ARRAY","PACOTE","SERVIDOR","CLIENTE","ROTAS",
  "TELA","ESTILOS","FORMULARIO","TIPOGRAFIA","RENDER","HOOKS","STATE","CONTEXT",
  "PERFORMANCE","BUNDLE","DEPLOY","ATUALIZACAO","VERSAO","PROJETO","REPOSITORIO",
  "GITHUB","QUALIDADE","ACESSIBILIDADE","RESPONSIVO","DEBUG","OTIMIZACAO","MEMORIA",
  "PROCESSO","ARQUITETURA","FRAMEWORK","BIBLIOTECA"
];

function pickRandomWord() {
  const idx = Math.floor(Math.random() * WORDS.length);
  return WORDS[idx].toUpperCase();
}

function normalizeLetter(ch: string) {
  const m = ch?.toUpperCase().match(/[A-Z]/);
  return m ? m[0] : "";
}

export default function HomeScreen() {
  const [secretWord, setSecretWord] = useState(pickRandomWord());
  const [guessedLetters, setGuessedLetters] = useState(new Set<string>());
  const [wrongLetters, setWrongLetters] = useState(new Set<string>());
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ERRORS);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [typed, setTyped] = useState("");

  const inputRef = useRef<TextInput>(null);

  const maskedWord = useMemo(() => {
    return secretWord
      .split("")
      .map((ch) => (guessedLetters.has(ch) ? ch : "_"))
      .join(" ");
  }, [secretWord, guessedLetters]);

  const hasWon = useMemo(
    () => secretWord.split("").every((ch) => guessedLetters.has(ch)),
    [secretWord, guessedLetters]
  );

  useEffect(() => {
    if (hasWon && status === "playing") setStatus("won");
  }, [hasWon, status]);

  useEffect(() => {
    if (attemptsLeft <= 0 && status === "playing") setStatus("lost");
  }, [attemptsLeft, status]);

  const handleGuess = useCallback(
    (letter: string) => {
      const L = normalizeLetter(letter);
      if (!L || status !== "playing") return;

      if (guessedLetters.has(L) || wrongLetters.has(L)) return;

      if (secretWord.includes(L)) {
        const next = new Set(guessedLetters);
        next.add(L);
        setGuessedLetters(next);
      } else {
        const nextW = new Set(wrongLetters);
        nextW.add(L);
        setWrongLetters(nextW);
        setAttemptsLeft((prev) => prev - 1);
      }
    },
    [status, guessedLetters, wrongLetters, secretWord]
  );

  const onTypeSubmit = useCallback(() => {
    if (!typed) return;
    handleGuess(typed[0]);
    setTyped("");
    inputRef.current?.blur?.();
  }, [typed, handleGuess]);

  const resetGame = useCallback(() => {
    setSecretWord(pickRandomWord());
    setGuessedLetters(new Set());
    setWrongLetters(new Set());
    setAttemptsLeft(MAX_ERRORS);
    setStatus("playing");
    setTyped("");
  }, []);

  const LetterKey = ({ letter }: { letter: string }) => {
    const triedCorrect = guessedLetters.has(letter);
    const triedWrong = wrongLetters.has(letter);
    const disabled = triedCorrect || triedWrong || status !== "playing";

    return (
      <TouchableOpacity
        disabled={disabled}
        onPress={() => handleGuess(letter)}
        style={[
          styles.key,
          triedCorrect && styles.keyCorrect,
          triedWrong && styles.keyWrong,
          disabled && styles.keyDisabled,
        ]}
      >
        <Text style={styles.keyText}>{letter}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Jogo da Forca</Text>
        <Text style={styles.subtitle}>Adivinhe a palavra secreta!</Text>
      </View>

      <View style={styles.topRow}>
        <View style={styles.svgWrap}>
          <HangmanSVG errors={wrongLetters.size} />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Tentativas restantes</Text>
          <Text style={styles.attempts}>{attemptsLeft}</Text>

          <Text style={[styles.label, { marginTop: 12 }]}>Palavra</Text>
          <Text style={styles.masked}>{maskedWord}</Text>

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={typed}
              onChangeText={(t) => setTyped(normalizeLetter(t))}
              maxLength={1}
              placeholder="Digite uma letra"
              placeholderTextColor="#a7b0c0"
              autoCapitalize="characters"
              onSubmitEditing={onTypeSubmit}
              editable={status === "playing"}
            />
            <TouchableOpacity
              style={styles.btn}
              onPress={onTypeSubmit}
              disabled={!typed || status !== "playing"}
            >
              <Text style={styles.btnText}>Enviar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={resetGame}>
            <Text style={styles.btnText}>Reiniciar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.label, { marginTop: 8 }]}>Teclado</Text>
      <View style={styles.keyboard}>
        {ALPHABET.map((l) => (
          <LetterKey key={l} letter={l} />
        ))}
      </View>

      {status !== "playing" && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{status === "won" ? "Parabéns!" : "Fim de jogo"}</Text>
            <Text style={styles.modalText}>
              {status === "won"
                ? "Você adivinhou a palavra:"
                : "Suas tentativas acabaram. A palavra era:"}
            </Text>
            <Text style={styles.wordReveal}>{secretWord}</Text>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary, { marginTop: 16 }]} onPress={resetGame}>
              <Text style={styles.btnText}>Jogar novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function HangmanSVG({ errors = 0 }: { errors: number }) {
  const head = errors >= 1;
  const body = errors >= 2;
  const armL = errors >= 3;
  const armR = errors >= 4;
  const legL = errors >= 5;
  const legR = errors >= 6;

  return (
    <Svg width={160} height={160}>
      {/* Forca */}
      <Line x1="10" y1="150" x2="120" y2="150" stroke="#cbd5e1" strokeWidth="6" />
      <Line x1="40" y1="150" x2="40" y2="20" stroke="#cbd5e1" strokeWidth="6" />
      <Line x1="40" y1="20" x2="105" y2="20" stroke="#cbd5e1" strokeWidth="6" />
      <Line x1="105" y1="20" x2="105" y2="40" stroke="#cbd5e1" strokeWidth="6" />

      {/* Boneco */}
      {head && <Circle cx="105" cy="55" r="15" stroke="#e11d48" strokeWidth="4" fill="none" />}
      {body && <Line x1="105" y1="70" x2="105" y2="105" stroke="#e11d48" strokeWidth="4" />}
      {armL && <Line x1="105" y1="80" x2="85" y2="95" stroke="#e11d48" strokeWidth="4" />}
      {armR && <Line x1="105" y1="80" x2="125" y2="95" stroke="#e11d48" strokeWidth="4" />}
      {legL && <Line x1="105" y1="105" x2="90" y2="130" stroke="#e11d48" strokeWidth="4" />}
      {legR && <Line x1="105" y1="105" x2="120" y2="130" stroke="#e11d48" strokeWidth="4" />}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  header: { alignItems: "center", marginBottom: 8 },
  title: { color: "#e2e8f0", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#94a3b8", marginTop: 4 },
  topRow: { flexDirection: "row", gap: 16, marginTop: 8 },
  svgWrap: { backgroundColor: "#0b1222", borderRadius: 16, borderWidth: 1, borderColor: "#1f2a44", padding: 12 },
  infoBox: { flex: 1, backgroundColor: "#0b1222", borderRadius: 16, borderWidth: 1, borderColor: "#1f2a44", padding: 12 },
  label: { color: "#93c5fd", fontSize: 12 },
  attempts: { color: "#e2e8f0", fontSize: 28, fontWeight: "700" },
  masked: { color: "#e2e8f0", fontSize: 28, fontWeight: "700", letterSpacing: 3, marginTop: 4 },
  inputRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  input: {
    flex: 1, backgroundColor: "#0f172a", borderColor: "#1f2a44", borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 12, color: "#e2e8f0", fontSize: 16
  },
  btn: { backgroundColor: "#1e293b", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "#334155" },
  btnPrimary: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  btnSecondary: { marginTop: 8, backgroundColor: "#111827" },
  btnText: { color: "#e2e8f0", fontWeight: "700" },
  keyboard: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  key: {
    width: 36, height: 44, borderRadius: 10, backgroundColor: "#111827",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1f2a44"
  },
  keyText: { color: "#e2e8f0", fontWeight: "700", fontSize: 16 },
  keyCorrect: { backgroundColor: "#14532d", borderColor: "#16a34a" },
  keyWrong: { backgroundColor: "#3f0f1a", borderColor: "#ef4444" },
  keyDisabled: { opacity: 0.7 },
  overlay: {
    position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: "#00000088", alignItems: "center", justifyContent: "center"
  },
  modal: {
    width: "85%", backgroundColor: "#0b1222", borderRadius: 20,
    borderWidth: 1, borderColor: "#1f2a44", padding: 20, alignItems: "center"
  },
  modalTitle: { color: "#e2e8f0", fontSize: 22, fontWeight: "800" },
  modalText: { color: "#94a3b8", marginTop: 8, textAlign: "center" },
  wordReveal: { color: "#93c5fd", fontSize: 28, fontWeight: "800", letterSpacing: 2, marginTop: 8 },
});
