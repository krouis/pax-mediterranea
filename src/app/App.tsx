import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { LanguageSelector } from '../ui/LanguageSelector';

type Screen = 'menu' | 'select' | 'game' | 'campaign' | 'online';

export function App() {
  const { t } = useTranslation();
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
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const displayPlayer = (name: string) =>
    name === 'carthage' || name === 'rome' ? t(`content:factions.${name}.name`) : name;
  const displayEvent = (state: GameState) => {
    const event = state.eventLog.at(-1);
    if (!event) return '';
    const values = { ...event.values };
    if (typeof values.player === 'string') values.player = displayPlayer(values.player);
    if (typeof values.territory === 'string')
      values.territory = t(`content:territories.${values.territory}`);
    if (typeof values.unit === 'string') values.unit = t(`content:units.${values.unit}`);
    if (typeof values.card === 'string') values.card = t(`content:cards.${values.card}.name`);
    if (typeof values.patron === 'string')
      values.patron = t(`content:patrons.${values.patron}.name`);
    return t(event.key, values);
  };

  useEffect(() => {
    savePreferences(preferences);
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
          <p className="eyebrow">{t('brand.genre')}</p>
          <h1>{t('brand.name')}</h1>
          <p className="tagline">{t('brand.tagline')}</p>
        </header>
        <nav className="menu-actions" aria-label={t('accessibility:gameModes')}>
          <button className="primary large" onClick={() => startMode('solo')}>
            <span>⚔</span>
            <strong>{t('game:modes.quick')}</strong>
            <small>
              {t('numbers.minutes', { min: 10, max: 25 })} · {t('game:modes.solo')}
            </small>
          </button>
          {savedGame && (
            <button
              onClick={() => {
                setGame(savedGame);
                setScreen('game');
              }}
            >
              <span>▶</span>
              <strong>{t('actions.continue')}</strong>
              <small>{t('numbers.turn', { value: savedGame.turn })}</small>
            </button>
          )}
          <button
            onClick={() => {
              setScreen('campaign');
              setMode('campaign');
            }}
          >
            <span>♜</span>
            <strong>{t('game:modes.campaign')}</strong>
            <small>{t('campaigns:sicilian-question.title')}</small>
          </button>
          <button onClick={() => startMode('hotseat')}>
            <span>♟</span>
            <strong>{t('game:modes.hotseat')}</strong>
            <small>
              {t('numbers.players', { count: 2 })} · {t('game:modes.oneDevice')}
            </small>
          </button>
          <button onClick={() => startMode('tutorial')}>
            <span>?</span>
            <strong>{t('game:modes.tutorial')}</strong>
            <small>
              {t('numbers.minutes', { min: 3, max: 5 })} · {t('content:factions.carthage.name')}
            </small>
          </button>
          <button onClick={() => setScreen('online')}>
            <span>⌁</span>
            <strong>{t('game:modes.online')}</strong>
            <small>{t('game:modes.transportPreview')}</small>
          </button>
        </nav>
        <button
          className="icon-button settings-button"
          onClick={() => setSettings(true)}
          aria-label={t('accessibility:settings')}
        >
          ⚙
        </button>
        <LanguageSelector
          compact
          value={preferences.locale}
          onChange={(locale) => setPreferences((current) => ({ ...current, locale }))}
        />
        <footer>
          {t('status.offlineReady')} · {t('status.noTracking')} · {t('status.openSource')}
        </footer>
        {settings && (
          <SettingsDialog
            preferences={preferences}
            setPreferences={setPreferences}
            close={() => setSettings(false)}
          />
        )}
        {needRefresh && (
          <div className="update-toast" role="status">
            {t('status.updateReady')}
            <button onClick={() => void updateServiceWorker(true)}>
              {t('actions.reloadUpdate')}
            </button>
            <button onClick={() => setNeedRefresh(false)}>{t('actions.later')}</button>
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
          <span className="directional-arrow" aria-hidden="true">
            ←
          </span>{' '}
          {t('actions.back')}
        </button>
        <p className="eyebrow">{t('campaigns:sicilian-question.chapter')}</p>
        <h1>{t(scenario.titleKey)}</h1>
        <div className="campaign-illustration" aria-hidden="true">
          <span>⛵</span>
          <span>♜</span>
          <span>▲</span>
        </div>
        <section className="stone-panel prose">
          <p>{t(scenario.introKey)}</p>
          <h2>{t('campaigns:sicilian-question.objectiveTitle')}</h2>
          <p>{t(scenario.objectiveKey)}</p>
          <p className="historical-note">{t(scenario.historicalNoteKey)}</p>
        </section>
        <button className="primary large" onClick={() => begin('carthage', 'baal-hammon')}>
          {t('actions.play')}
        </button>
      </main>
    );
  }

  if (screen === 'online') {
    return (
      <main className="sub-page parchment">
        <button className="back" onClick={() => setScreen('menu')}>
          <span className="directional-arrow" aria-hidden="true">
            ←
          </span>{' '}
          {t('actions.back')}
        </button>
        <p className="eyebrow">{t('game:room.adapter')}</p>
        <h1>{t('game:modes.online')}</h1>
        <section className="stone-panel prose">
          <label>
            {t('game:room.code')}
            <input
              dir="ltr"
              maxLength={8}
              placeholder={t('game:room.placeholder')}
              aria-describedby="room-help"
            />
          </label>
          <p id="room-help">{t('game:instructions.roomUnavailable')}</p>
          <button disabled>{t('actions.joinRoom')}</button>
        </section>
      </main>
    );
  }

  if (screen === 'select') {
    return (
      <main className="sub-page parchment">
        <button className="back" onClick={() => setScreen('menu')}>
          <span className="directional-arrow" aria-hidden="true">
            ←
          </span>{' '}
          {t('actions.back')}
        </button>
        <p className="eyebrow">
          {mode === 'tutorial' ? t('game:modes.guided') : t('game:modes.quick')}
        </p>
        <h1>{t('game:selection.faction')}</h1>
        <div className="faction-grid">
          {(Object.keys(factions) as FactionId[]).map((id) => (
            <section key={id} className={`faction-card ${id}`}>
              <div className="faction-emblem" aria-hidden="true">
                {factions[id].icon}
              </div>
              <h2>{t(factions[id].nameKey)}</h2>
              <p>{t(factions[id].passiveKey)}</p>
              <h3>{t('game:selection.patron')}</h3>
              {factions[id].patrons.map((patron) => (
                <button key={patron} className="patron" onClick={() => begin(id, patron)}>
                  <strong>{t(patrons[patron].nameKey)}</strong>
                  <small>{t(patrons[patron].descriptionKey)}</small>
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
    setMessage(displayEvent(next));
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
          [
            t('game:combat.confirm', { territory: t(destination.nameKey) }),
            t('game:combat.attackStrength', { value: preview.attack }),
            t('game:combat.defenseStrength', { value: preview.defense }),
            t('game:combat.outcome', { outcome: t(`game:combat.${preview.outcome}`) }),
          ].join(' · '),
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
    if (!result.ok) setMessage(t(result.error ?? 'game:errors.unsupported'));
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
        <button
          className="crest"
          onClick={() => setScreen('menu')}
          aria-label={t('accessibility:returnMenu')}
        >
          {factions[player.faction].icon}
        </button>
        <div>
          <span>{displayPlayer(player.name)}</span>
          <small>
            {t('numbers.turn', { value: game.turn })} · {t(`game:phase.${game.phase}`)}
          </small>
        </div>
        <dl>
          <div>
            <dt>●</dt>
            <dd>
              {new Intl.NumberFormat(preferences.locale).format(player.coins)}
              <small>{t('game:hud.coins')}</small>
            </dd>
          </div>
          <div>
            <dt>✦</dt>
            <dd>
              {new Intl.NumberFormat(preferences.locale).format(player.favor)}/
              {new Intl.NumberFormat(preferences.locale).format(3)}
              <small>{t('game:hud.favor')}</small>
            </dd>
          </div>
          <div>
            <dt>♜</dt>
            <dd>
              {new Intl.NumberFormat(preferences.locale).format(player.pax)}/
              {new Intl.NumberFormat(preferences.locale).format(8)}
              <small>{t('game:hud.pax')}</small>
            </dd>
          </div>
        </dl>
        <button
          className="icon-button"
          onClick={() => setSettings(true)}
          aria-label={t('accessibility:settings')}
        >
          ⚙
        </button>
      </header>
      <div className="objective-banner">
        <strong>{t('game:hud.objective')}</strong> {t('game:objective.pax', { target: 8 })}
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
          <p className="phase-label">
            {t('game:hud.phase')} · {t(`game:phase.${game.phase}`)}
          </p>
          <h2>
            {selected ? t(`content:units.${selected.type}`) : t('game:instructions.selectUnit')}
          </h2>
          {message && (
            <p className="status" role="status">
              {message}
            </p>
          )}
          <section>
            <h3>{t('game:actions.recruit')}</h3>
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
                    else setMessage(t(result.error ?? 'game:errors.unsupported'));
                    setTutorialStep(Math.max(tutorialStep, 3));
                  }}
                >
                  <span>{type === 'infantry' ? '♟' : type === 'cavalry' ? '♞' : '⛵'}</span>
                  <small>
                    {t(`content:units.${type}`)}
                    <br />● {unitRules[type].cost}
                  </small>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>
              {t('game:hud.cards')} ·{' '}
              {new Intl.NumberFormat(preferences.locale).format(player.hand.length)}/
              {new Intl.NumberFormat(preferences.locale).format(3)}
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
                    else setMessage(t(result.error ?? 'game:errors.unsupported'));
                    setTutorialStep(Math.max(tutorialStep, 4));
                  }}
                >
                  <strong>{t(cards[card].nameKey)}</strong>
                  <small>{t(cards[card].descriptionKey)}</small>
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
              else setMessage(t(result.error ?? 'game:errors.unsupported'));
            }}
          >
            ✦ {t('game:actions.invokeFavor')} · {t(patrons[player.patron].nameKey)}
          </button>
          <div className="panel-footer">
            <button
              onClick={() => {
                saveGame(game);
                setMessage(t('status.saved'));
              }}
            >
              {t('actions.save')}
            </button>
            <button className="primary" onClick={endTurn}>
              {t('game:actions.endTurn')}{' '}
              <span className="directional-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </aside>
      </div>
      {tutorialStep > 0 && tutorialStep < 5 && (
        <div className="tutorial-tip" role="status">
          <strong>{tutorialStep}/4</strong>
          {
            [
              t('game:instructions.selectUnit'),
              t('game:instructions.tutorialMove'),
              t('game:instructions.tutorialRecruit'),
              t('game:instructions.tutorialFlavor'),
            ][tutorialStep - 1]
          }
          <button onClick={() => setTutorialStep(0)}>{t('actions.skip')}</button>
        </div>
      )}
      {concealed && (
        <div className="scrim">
          <section className="dialog stone-panel">
            <p className="eyebrow">{t('status.passDevice')}</p>
            <h2>{displayPlayer(activePlayer(game).name)}</h2>
            <button
              className="primary large"
              onClick={() => {
                setConcealed(false);
                setGame(startActionPhase(game));
              }}
            >
              {t('actions.revealBoard')}
            </button>
          </section>
        </div>
      )}
      {game.winnerId && (
        <div className="scrim">
          <section className="dialog victory">
            <span>✦</span>
            <h2>
              {t('game:victory.title', {
                player: displayPlayer(
                  game.players.find(({ id }) => id === game.winnerId)?.name ?? '',
                ),
              })}
            </h2>
            <button onClick={() => setScreen('menu')}>{t('actions.returnMenu')}</button>
          </section>
        </div>
      )}
      {settings && (
        <SettingsDialog
          preferences={preferences}
          setPreferences={setPreferences}
          close={() => setSettings(false)}
        />
      )}
    </main>
  );
}
