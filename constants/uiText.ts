
export const UI_TEXT = {
  brand: {
    studioName: "CRUZPHAM TRIVIA STUDIOS",
    appName: "CRUZPHAM TRIVIA",
    footer: "CREATED BY EL CRUZPHAM • POWERED BY CRUZPHAM TRIVIA STUDIOS"
  },
  auth: {
    tabs: {
      login: "LOG IN",
      register: "GET TOKEN"
    },
    login: {
      title: "ENTER STUDIO",
      usernamePlaceholder: "IDENTITY (USERNAME)",
      tokenPlaceholder: "ACCESS TOKEN",
      button: "ENTER STUDIO",
      authenticating: "VERIFYING...",
      helper: "Enter your username and the secret token you saved."
    },
    register: {
      title: "CREATE IDENTITY",
      desc: "First time? Create a secure identity to manage your shows.",
      usernamePlaceholder: "CHOOSE IDENTITY",
      button: "CREATE TOKEN",
      generating: "MINTING TOKEN...",
      successTitle: "IDENTITY CREATED",
      copyWarning: "Save this token now. It acts as your password and cannot be recovered if lost.",
      proceedButton: "I'VE SAVED IT — LOG IN"
    },
    errors: {
      rateLimit: "Too many attempts. Please wait a moment.",
      invalid: "Identity or Token incorrect.",
      system: "Studio connection error."
    },
    offline: "STUDIO DISCONNECTED"
  },
  dashboard: {
    title: "MY SHOWS",
    newButton: "CREATE TEMPLATE",
    emptyState: "No shows found. Create a template to start your first live game.",
    pagination: "PAGE",
    card: {
      edit: "EDIT",
      live: "GO LIVE",
      delete: "DELETE"
    }
  },
  setup: {
    title: "NEW SHOW SETUP",
    colsLabel: "CATEGORIES (COLUMNS)",
    rowsLabel: "QUESTIONS PER CATEGORY",
    rowsHelper: "Points scale from 100 to 1000",
    button: "CREATE GRID",
    cancel: "CANCEL"
  },
  editor: {
    title: "EDITOR",
    aiLabel: "AI ASSIST",
    aiPlaceholder: "Topic (e.g. 90s Music)",
    aiButton: "AUTO-FILL",
    save: "SAVE SHOW",
    cancel: "EXIT",
    don: "D.O.N"
  },
  game: {
    live: "LIVE",
    ready: "STUDIO READY",
    controls: {
      reveal: "REVEAL",
      award: "AWARD",
      void: "VOID",
      return: "RETURN",
      back: "BACK",
      revealed: "ANSWER REVEALED"
    },
    tooltips: {
      reveal: "Space: Reveal Answer",
      award: "Enter: Award Points",
      void: "Esc: Void Question",
      return: "Backspace: Return to Board",
      playerSelect: "Arrows: Select Player",
      score: "+/-: Adjust Score"
    }
  },
  director: {
    title: "DIRECTOR CONTROL",
    detachedTitle: "DIRECTOR [POPOUT]",
    sync: "LIVE SYNC",
    popout: "POP OUT WINDOW",
    close: "CLOSE PANEL",
    tabs: {
      game: "CONTROLS",
      players: "PLAYERS",
      questions: "QUESTIONS",
      log: "ACTIVITY"
    },
    gameTab: {
      titleLabel: "BROADCAST TITLE",
      actionsLabel: "LIVE ACTIONS",
      forceAward: "FORCE AWARD",
      forceVoid: "FORCE VOID",
      forceClose: "FORCE CLOSE Q",
      stopTimer: "STOP TIMER",
      timerLabel: "QUICK TIMER"
    },
    placeholder: {
      title: "DIRECTOR POPPED OUT",
      desc: "Controls are active in a separate window.",
      button: "BRING BACK PANEL"
    }
  }
};
