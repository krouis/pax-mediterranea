import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { cards, factions, patrons, scenarios, unitRules } from '../content/gameContent';
import { runAITurn } from '../game/ai/ai';
import { activePlayer, applyAction, combatPreview, startActionPhase } from '../game/engine/rules';
import { createGame } from '../game/engine/state';
import type { FactionId, GameState, UnitType } from '../game/engine/types';
import { loadGame, loadPreferences, saveGame, savePreferences } from '../persistence/preferences';
import { playTone } from '../audio/sound';
import { MapBoard } from '../ui/MapBoard';
import { SettingsDialog } from '../ui/SettingsDialog';
import { translate, type MessageKey } from './i18n';

type Screen = 'menu' | 'select' | 'game' | 'campaign' | 'online';

export function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [preferences, setPreferences] = useState(loadPreferences);
  const [settings, setSettings] = useState(false);
  const [game, setGame] = useState<GameState>();
  const [mode, setMode] = useState<GameState['mode']>('solo');
  const [selectedUnit, setSelectedUnit] = useState<string>();
  const [message, setMessage] = useState('');
  const [concealed, setConcealed] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const savedGame = loadGame();
  const t = (key: MessageKey) => translate(preferences.locale, key);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    savePreferences(preferences);
    document.documentElement.lang = preferences.locale;
    document.documentElement.dataset.motion = preferences.reducedMotion ? 'reduced' : 'full';
  }, [preferences]);

  const begin = (faction: FactionId, patron: string) => {
    const next = startActionPhase(
      createGame({
        faction,
        patron,
        mode,
        secondPlayerAI: mode !== 'hotseat',
        seed: mode === 'campaign' ? 218 : 270,
      }),
    );
    setGame(next);
    setScreen('game');
    setTutorialStep(mode === 'tutorial' ? 1 : 0);
  };

  const startMode = (nextMode: GameState['mode']) => {
    setMode(nextMode);
    setScreen('select');
  };

  if (screen === 'menu') {
    return (
      <main className="menu-page">
        <header className="hero">
          <span className="sun-mark" aria-hidden="true">
            ✦
          </span>
          <p className="eyebrow">A MEDITERRANEAN STRATEGY GAME</p>
          <h1>
            Pax
            <br />
            <span>Mediterranea</span>
          </h1>
          <p className="tagline">{t('tagline')}</p>
        </header>
        <nav className="menu-actions" aria-label="Game modes">
          <button className="primary large" onClick={() => startMode('solo')}>
            <span>⚔</span>
            <strong>{t('quick')}</strong>
            <small>10–25 min · {t('solo')}</small>
          </button>
          {savedGame && (
            <button
              onClick={() => {
                setGame(savedGame);
                setScreen('game');
              }}
            >
              <span>▶</span>
              <strong>{t('continue')}</strong>
              <small>Turn {savedGame.turn}</small>
            </button>
          )}
          <button
            onClick={() => {
              setScreen('campaign');
              setMode('campaign');
            }}
          >
            <span>♜</span>
            <strong>{t('campaign')}</strong>
            <small>The Sicilian Question</small>
          </button>
          <button onClick={() => startMode('hotseat')}>
            <span>♟</span>
            <strong>{t('hotseat')}</strong>
            <small>2 players · one device</small>
          </button>
          <button onClick={() => startMode('tutorial')}>
            <span>?</span>
            <strong>{t('tutorial')}</strong>
            <small>3–5 min · Carthage</small>
          </button>
          <button onClick={() => setScreen('online')}>
            <span>⌁</span>
            <strong>{t('online')}</strong>
            <small>Optional transport preview</small>
          </button>
        </nav>
        <button
          className="icon-button settings-button"
          onClick={() => setSettings(true)}
          aria-label={t('settings')}
        >
          ⚙
        </button>
        <footer>Offline ready · No tracking · Open source</footer>
        {settings && (
          <SettingsDialog
            preferences={preferences}
            setPreferences={setPreferences}
            close={() => setSettings(false)}
            t={t}
          />
        )}
        {needRefresh && (
          <div className="update-toast" role="status">
            A new version is ready.
            <button onClick={() => void updateServiceWorker(true)}>Reload updated version</button>
            <button onClick={() => setNeedRefresh(false)}>Later</button>
          </div>
        )}
      </main>
    );
  }

  if (screen === 'campaign') {
    const scenario = scenarios[0];
    return (
      <main className="sub-page parchment">
        <button className="back" onClick={() => setScreen('menu')}>
          ← {t('back')}
        </button>
        <p className="eyebrow">CARTHAGINIAN CAMPAIGN · I</p>
        <h1>{scenario.title}</h1>
        <div className="campaign-illustration" aria-hidden="true">
          <span>⛵</span>
          <span>♜</span>
          <span>▲</span>
        </div>
        <section className="stone-panel prose">
          <p>{scenario.intro}</p>
          <h2>Objective</h2>
          <p>{scenario.objective}</p>
          <p className="historical-note">{scenario.historicalNote}</p>
        </section>
        <button className="primary large" onClick={() => begin('carthage', 'baal-hammon')}>
          {t('play')}
        </button>
      </main>
    );
  }

  if (screen === 'online') {
    return (
      <main className="sub-page parchment">
        <button className="back" onClick={() => setScreen('menu')}>
          ← {t('back')}
        </button>
        <p className="eyebrow">MULTIPLAYER ADAPTER</p>
        <h1>{t('online')}</h1>
        <section className="stone-panel prose">
          <label>
            Room code
            <input maxLength={8} placeholder="PAX-270" aria-describedby="room-help" />
          </label>
          <p id="room-help">{t('roomUnavailable')}</p>
          <button disabled>Join room</button>
        </section>
      </main>
    );
  }

  if (screen === 'select') {
    return (
      <main className="sub-page parchment">
        <button className="back" onClick={() => setScreen('menu')}>
          ← {t('back')}
        </button>
        <p className="eyebrow">{mode === 'tutorial' ? 'GUIDED VOYAGE' : 'QUICK SKIRMISH'}</p>
        <h1>{t('selectFaction')}</h1>
        <div className="faction-grid">
          {(Object.keys(factions) as FactionId[]).map((id) => (
            <section key={id} className={`faction-card ${id}`}>
              <div className="faction-emblem" aria-hidden="true">
                {factions[id].icon}
              </div>
              <h2>{factions[id].name}</h2>
              <p>{factions[id].passive}</p>
              <h3>{t('selectPatron')}</h3>
              {factions[id].patrons.map((patron) => (
                <button key={patron} className="patron" onClick={() => begin(id, patron)}>
                  <strong>{patrons[patron].name}</strong>
                  <small>{patrons[patron].description}</small>
                </button>
              ))}
            </section>
          ))}
        </div>
      </main>
    );
  }

  if (!game) return null;
  const player = activePlayer(game);
  const selected = game.units.find((unit) => unit.id === selectedUnit);

  const act = (next: GameState, sound: 'move' | 'coin' | 'turn' = 'move') => {
    setGame(next);
    saveGame(next);
    playTone(sound, preferences.sound);
    setMessage(next.eventLog.at(-1)?.message ?? '');
  };

  const chooseTerritory = (territoryId: string) => {
    if (!selected || selected.ownerId !== player.id) return;
    const destination = game.territories.find(({ id }) => id === territoryId);
    if (!destination) return;
    const hostile = Boolean(
      (destination.ownerId && destination.ownerId !== player.id) ||
      game.units.some((unit) => unit.territoryId === territoryId && unit.ownerId !== player.id),
    );
    if (hostile) {
      const preview = combatPreview(game, selected, territoryId);
      if (
        !confirm(
          `Attack ${destination.name}? Attack ${preview.attack} · Defense ${preview.defense} · ${preview.outcome}`,
        )
      )
        return;
    }
    const result = applyAction(game, {
      type: hostile ? 'ATTACK' : 'MOVE',
      playerId: player.id,
      unitId: selected.id,
      to: territoryId,
    });
    if (!result.ok) setMessage(result.error ?? '');
    else {
      act(result.state);
      setSelectedUnit(undefined);
      setTutorialStep(Math.max(tutorialStep, 2));
    }
  };

  const endTurn = () => {
    let next = applyAction(game, { type: 'END_TURN', playerId: player.id }).state;
    setSelectedUnit(undefined);
    if (next.mode === 'hotseat') {
      setConcealed(true);
      act(next, 'turn');
      return;
    }
    if (activePlayer(next).isAI) next = runAITurn(next, 'strategist');
    next = startActionPhase(next);
    act(next, 'turn');
    setTutorialStep(Math.max(tutorialStep, 5));
  };

  return (
    <main className="game-page">
      <header className="topbar">
        <button className="crest" onClick={() => setScreen('menu')} aria-label="Return to menu">
          {factions[player.faction].icon}
        </button>
        <div>
          <span>{player.name}</span>
          <small>
            {t('turn')} {game.turn} · {game.phase}
          </small>
        </div>
        <dl>
          <div>
            <dt>●</dt>
            <dd>
              {player.coins}
              <small>{t('coins')}</small>
            </dd>
          </div>
          <div>
            <dt>✦</dt>
            <dd>
              {player.favor}/3<small>{t('favor')}</small>
            </dd>
          </div>
          <div>
            <dt>♜</dt>
            <dd>
              {player.pax}/8<small>{t('pax')}</small>
            </dd>
          </div>
        </dl>
        <button
          className="icon-button"
          onClick={() => setSettings(true)}
          aria-label={t('settings')}
        >
          ⚙
        </button>
      </header>
      <div className="objective-banner">
        <strong>Objective</strong> {t('objective')}
      </div>
      <div className="board-layout">
        <MapBoard
          state={game}
          selectedUnitId={selectedUnit}
          selectUnit={(id) => {
            setSelectedUnit(id);
            playTone('select', preferences.sound);
          }}
          chooseTerritory={chooseTerritory}
        />
        <aside className="action-panel stone-panel">
          <p className="phase-label">PHASE · {game.phase.toUpperCase()}</p>
          <h2>{selected ? selected.type : t('selectUnit')}</h2>
          {message && (
            <p className="status" role="status">
              {message}
            </p>
          )}
          <section>
            <h3>{t('recruit')}</h3>
            <div className="recruit-row">
              {(['infantry', 'cavalry', 'fleet'] as UnitType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    const home = game.territories.find(
                      (territory) =>
                        territory.ownerId === player.id &&
                        (type === 'fleet'
                          ? territory.terrain === 'port'
                          : ['city', 'port'].includes(territory.terrain)),
                    );
                    if (!home) return;
                    const result = applyAction(game, {
                      type: 'RECRUIT',
                      playerId: player.id,
                      unitType: type,
                      territoryId: home.id,
                    });
                    if (result.ok) act(result.state, 'coin');
                    else setMessage(result.error ?? '');
                    setTutorialStep(Math.max(tutorialStep, 3));
                  }}
                >
                  <span>{type === 'infantry' ? '♟' : type === 'cavalry' ? '♞' : '⛵'}</span>
                  <small>
                    {type}
                    <br />● {unitRules[type].cost}
                  </small>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>
              {t('cards')} · {player.hand.length}/3
            </h3>
            <div className="card-hand">
              {player.hand.map((card) => (
                <button
                  key={card}
                  onClick={() => {
                    const result = applyAction(game, {
                      type: 'PLAY_CARD',
                      playerId: player.id,
                      cardId: card,
                      unitId: selectedUnit,
                    });
                    if (result.ok) act(result.state);
                    else setMessage(result.error ?? '');
                    setTutorialStep(Math.max(tutorialStep, 4));
                  }}
                >
                  <strong>{cards[card].name}</strong>
                  <small>{cards[card].description}</small>
                </button>
              ))}
            </div>
          </section>
          <button
            onClick={() => {
              const home = game.territories.find((territory) => territory.ownerId === player.id)!;
              const result = applyAction(game, {
                type: 'INVOKE_FAVOR',
                playerId: player.id,
                territoryId: home.id,
              });
              if (result.ok) act(result.state);
              else setMessage(result.error ?? '');
            }}
          >
            ✦ {t('invoke')} · {patrons[player.patron].name}
          </button>
          <div className="panel-footer">
            <button
              onClick={() => {
                saveGame(game);
                setMessage(t('saved'));
              }}
            >
              {t('save')}
            </button>
            <button className="primary" onClick={endTurn}>
              {t('endTurn')} →
            </button>
          </div>
        </aside>
      </div>
      {tutorialStep > 0 && tutorialStep < 5 && (
        <div className="tutorial-tip" role="status">
          <strong>{tutorialStep}/4</strong>
          {
            [
              t('selectUnit'),
              'Move to a highlighted territory and capture it.',
              'Recruit infantry in Carthage.',
              'Play a card, invoke favor, then end your turn.',
            ][tutorialStep - 1]
          }
          <button onClick={() => setTutorialStep(0)}>Skip</button>
        </div>
      )}
      {concealed && (
        <div className="scrim">
          <section className="dialog stone-panel">
            <p className="eyebrow">{t('passDevice')}</p>
            <h2>{activePlayer(game).name}</h2>
            <button
              className="primary large"
              onClick={() => {
                setConcealed(false);
                setGame(startActionPhase(game));
              }}
            >
              {t('reveal')}
            </button>
          </section>
        </div>
      )}
      {game.winnerId && (
        <div className="scrim">
          <section className="dialog victory">
            <span>✦</span>
            <h2>{game.players.find(({ id }) => id === game.winnerId)?.name} establishes peace!</h2>
            <button onClick={() => setScreen('menu')}>Return to menu</button>
          </section>
        </div>
      )}
      {settings && (
        <SettingsDialog
          preferences={preferences}
          setPreferences={setPreferences}
          close={() => setSettings(false)}
          t={t}
        />
      )}
    </main>
  );
}
