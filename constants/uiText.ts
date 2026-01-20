

export const UI_TEXT = {
  brand: {
    studioName: "CRUZPHAM TRIVIA STUDIOS",
    appName: "CRUZPHAM TRIVIA",
    footer: "CREATED BY EL CRUZPHAM • POWERED BY CRUZPHAM TRIVIA STUDIOS",
    credits1: "CREATED BY EL CRUZPHAM",
    credits2: "POWERED BY CRUZPHAM CREATOR NETWORK AGENCY"
  },
  common: {
    doubleOrNothing: "Double Or Nothing",
    reconnecting: "RESTORING SESSION...",
    adminBadge: "ADMINISTRATOR"
  },
  onboarding: {
    welcome: "Welcome! Let's set up your event.",
    prompt: "What's the name of your event?",
    placeholder: "e.g. Friday Night Trivia",
    continue: "CONTINUE",
    skip: "SKIP FOR NOW",
    defaultName: "CruzPham Trivia Event"
  },
  production: {
    selectTitle: "SELECT PRODUCTION",
    createTitle: "NEW PRODUCTION",
    namePlaceholder: "SHOW NAME (e.g. Trivia Night)",
    createButton: "CREATE SHOW",
    selectButton: "OPEN SHOW",
    switch: "SWITCH SHOW",
    currentPrefix: "SHOW: "
  },
  auth: {
    tabs: {
      login: "LOG IN",
      register: "REGISTER"
    },
    login: {
      title: "ENTER STUDIO",
      usernamePlaceholder: "IDENTITY (USERNAME)",
      tokenPlaceholder: "ACCESS TOKEN",
      button: "ENTER STUDIO",
      getToken: "GET TOKEN",
      authenticating: "VERIFYING CREDENTIALS...",
      helper: "Use the secure identity token provided by your Administrator."
    },
    request: {
      title: "REQUEST ACCESS",
      desc: "Fill this out and our team will reach out.",
      fields: {
        first: "FIRST NAME",
        last: "LAST NAME",
        tiktok: "TIKTOK HANDLE",
        tiktokHelp: "Example: @yourhandle",
        user: "PREFERRED USERNAME",
        userHelp: "No spaces, 3–20 characters"
      },
      buttons: {
        submit: "SEND REQUEST",
        sending: "SENDING...",
        back: "BACK"
      },
      success: {
        title: "REQUEST SENT",
        message: "Payment is required to receive your token. An admin will contact you with next steps.",
        done: "DONE"
      },
      errors: {
        duplicate: "You already requested access. Please wait for admin reply.",
        limit: "Too many requests. Please try again later.",
        required: "All fields are required."
      }
    },
    errors: {
      rateLimit: "Too many attempts. Please wait a moment.",
      invalid: "Invalid Username or Token. Please try again.",
      system: "Studio connection error.",
      expired: "Session expired. Please log in again.",
      revoked: "Access revoked. Contact Administrator."
    },
    offline: "STUDIO DISCONNECTED"
  },
  admin: {
    title: "STUDIO ADMINISTRATION",
    nav: {
      users: "USERS",
      requests: "INBOX",
      audit: "AUDIT LOG",
      settings: "SETTINGS",
      studio: "OPEN STUDIO DASHBOARD"
    },
    requests: {
      empty: "No requests found.",
      search: "SEARCH REQUESTS...",
      filters: {
        all: "ALL",
        pending: "PENDING",
        contacted: "CONTACTED",
        approved: "APPROVED",
        rejected: "REJECTED"
      },
      actions: {
        approve: "APPROVE & CREATE",
        reject: "REJECT",
        contact: "MARK CONTACTED",
        copyReply: "COPY REPLY",
        replyCopied: "COPIED"
      },
      details: {
        received: "RECEIVED",
        tiktok: "TIKTOK",
        user: "USERNAME",
        status: "STATUS"
      }
    },
    users: {
      create: "PROVISION IDENTITY",
      searchPlaceholder: "SEARCH IDENTITIES...",
      empty: "No users found.",
      status: {
        active: "ACTIVE",
        revoked: "REVOKED",
        suspended: "SUSPENDED"
      },
      actions: {
        grant: "GRANT ACCESS",
        revoke: "REVOKE ACCESS",
        issueToken: "ISSUE TOKEN",
        rotateToken: "ROTATE TOKEN",
        logout: "FORCE LOGOUT"
      }
    },
    tokens: {
      modalTitle: "IDENTITY TOKEN GENERATED",
      warning: "This token will appear ONLY ONCE. Copy it immediately.",
      copy: "COPY SECURE TOKEN",
      close: "I HAVE SAVED IT",
      expiryLabels: {
        never: "NO EXPIRY",
        oneDay: "24 HOURS",
        oneWeek: "7 DAYS"
      }
    },
    credentials: {
      title: "LOGIN DETAILS",
      warning: "THIS TOKEN SHOWS ONCE. COPY IT NOW.",
      usernameLabel: "USERNAME",
      tokenLabel: "ACCESS TOKEN",
      copyButton: "COPY LOGIN",
      emailButton: "EMAIL LOGIN",
      smsButton: "TEXT LOGIN",
      emailPlaceholder: "user@example.com",
      smsPlaceholder: "+1 (555) 000-0000",
      send: "SEND",
      sentSuccess: "SENT SUCCESSFULLY",
      done: "DONE"
    }
  },
  dashboard: {
    title: "MY SHOWS",
    adminTitle: "ALL STUDIO SHOWS",
    newButton: "CREATE TEMPLATE",
    emptyState: "No shows found. Create a template to start your first live game.",
    pagination: "PAGE",
    card: {
      edit: "EDIT",
      live: "GO LIVE",
      delete: "DELETE",
      ownerLabel: "OWNER: "
    },
    nav: {
      adminConsole: "ADMIN CONSOLE"
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
    don: "Double Or Nothing"
  },
  game: {
    live: "LIVE",
    ready: "STUDIO READY",
    controls: {
      reveal: "REVEAL",
      award: "AWARD",
      steal: "STEAL",
      confirmSteal: "CONFIRM STEAL",
      cancelSteal: "CANCEL",
      void: "VOID",
      return: "RETURN",
      back: "BACK",
      revealed: "ANSWER REVEALED",
      selectSteal: "SELECT PLAYER TO STEAL:"
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
      eventLabel: "EVENT NAME",
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