import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { cards, factions, patrons, scenarios } from '../content/gameContent';
import { runAITurn } from '../game/ai/ai';
import {
  activePlayer,
  applyAction,
  combatPreview,
  startActionPhase,
  unitCost,
} from '../game/engine/rules';
import { createGame } from '../game/engine/state';
import type { FactionId, GameEvent, GameState, UnitType } from '../game/engine/types';
import { loadGame, loadPreferences, saveGame, savePreferences } from '../persistence/preferences';
import { markScenarioComplete } from '../persistence/campaign';
import { playTone } from '../audio/sound';
import { MapBoard } from '../ui/board/MapBoard';
import { HistoryPanel } from '../ui/HistoryPanel';
import { SettingsDialog } from '../ui/SettingsDialog';
import { PixelDialog } from '../ui/components/PixelDialog';
import { MainMenuScreen } from '../ui/screens/MainMenuScreen';
import { CampaignIntroScreen } from '../ui/screens/CampaignIntroScreen';
import { OnlineStubScreen } from '../ui/screens/OnlineStubScreen';
import { FactionSelectScreen } from '../ui/screens/FactionSelectScreen';

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
  const [pendingAttack, setPendingAttack] = useState<{ unitId: string; territoryId: string }>();
  const [recruitSelection, setRecruitSelection] = useState<UnitType>();
  const savedGame = loadGame();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const [historyOpen, setHistoryOpen] = useState(false);
  const displayPlayer = (name: string) =>
    name === 'carthage' || name === 'rome' ? t(`content:factions.${name}.name`) : name;
  const formatEvent = (event: GameEvent) => {
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
  const displayEvent = (state: GameState) => {
    const event = state.eventLog.at(-1);
    return event ? formatEvent(event) : '';
  };

  useEffect(() => {
    savePreferences(preferences);
    document.documentElement.dataset.motion = preferences.reducedMotion ? 'reduced' : 'full';
  }, [preferences]);

  useEffect(() => {
    if (!game?.winnerId || !game.scenarioId) return;
    const scenario = scenarios.find(({ id }) => id === game.scenarioId);
    const winner = game.players.find(({ id }) => id === game.winnerId);
    if (scenario && winner && winner.faction === scenario.objective.factionId)
      markScenarioComplete(scenario.id);
  }, [game?.winnerId, game?.scenarioId, game?.players]);

  const begin = (faction: FactionId, patron: string) => {
    const next = startActionPhase(
      createGame({
        faction,
        patron,
        mode,
        secondPlayerAI: mode !== 'hotseat',
        seed: mode === 'campaign' ? 218 : 270,
        scenarioId: mode === 'campaign' ? scenarios[0].id : undefined,
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

  const overlays = (
    <>
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
    </>
  );

  if (screen === 'menu') {
    return (
      <>
        <MainMenuScreen
          preferences={preferences}
          setPreferences={setPreferences}
          savedGame={savedGame}
          onQuick={() => startMode('solo')}
          onContinue={() => {
            if (!savedGame) return;
            setGame(savedGame);
            setScreen('game');
          }}
          onCampaign={() => {
            setScreen('campaign');
            setMode('campaign');
          }}
          onHotseat={() => startMode('hotseat')}
          onTutorial={() => startMode('tutorial')}
          onOnline={() => setScreen('online')}
          onOpenSettings={() => setSettings(true)}
        />
        {overlays}
      </>
    );
  }

  if (screen === 'campaign') {
    return (
      <>
        <CampaignIntroScreen
          scenario={scenarios[0]}
          onBack={() => setScreen('menu')}
          onBegin={() => begin('carthage', 'baal-hammon')}
        />
        {overlays}
      </>
    );
  }

  if (screen === 'online') {
    return (
      <>
        <OnlineStubScreen
          onBack={() => setScreen('menu')}
          onQuick={() => startMode('solo')}
          onHotseat={() => startMode('hotseat')}
        />
        {overlays}
      </>
    );
  }

  if (screen === 'select') {
    return (
      <>
        <FactionSelectScreen mode={mode} onBack={() => setScreen('menu')} onSelect={begin} />
        {overlays}
      </>
    );
  }

  if (!game) return null;
  const player = activePlayer(game);
  const selected = game.units.find((unit) => unit.id === selectedUnit);
  const activeScenario = game.scenarioId
    ? scenarios.find(({ id }) => id === game.scenarioId)
    : undefined;
  const winner = game.winnerId ? game.players.find(({ id }) => id === game.winnerId) : undefined;
  const victoryTitleKey = activeScenario
    ? winner?.faction === activeScenario.objective.factionId
      ? 'game:victory.campaignComplete'
      : 'game:victory.campaignFailed'
    : 'game:victory.title';

  const act = (next: GameState, sound: 'move' | 'coin' | 'turn' = 'move') => {
    setGame(next);
    saveGame(next);
    playTone(sound, preferences.sound);
    setMessage(displayEvent(next));
  };

  const advanceTutorial = (fromStep: number, toStep: number) => {
    if (game.mode !== 'tutorial') return;
    setTutorialStep((step) => (step === fromStep ? toStep : step));
  };

  const commitMove = (unitId: string, territoryId: string, type: 'MOVE' | 'ATTACK') => {
    const result = applyAction(game, { type, playerId: player.id, unitId, to: territoryId });
    if (!result.ok) setMessage(t(result.error ?? 'game:errors.unsupported'));
    else {
      act(result.state);
      setSelectedUnit(undefined);
      advanceTutorial(2, 3);
    }
  };

  const recruitLegal = recruitSelection
    ? game.territories
        .filter(
          (territory) =>
            territory.ownerId === player.id &&
            (recruitSelection === 'fleet'
              ? territory.terrain === 'port'
              : territory.terrain === 'city' || territory.terrain === 'port'),
        )
        .map(({ id }) => id)
    : [];

  const chooseTerritory = (territoryId: string) => {
    if (recruitSelection) {
      const result = applyAction(game, {
        type: 'RECRUIT',
        playerId: player.id,
        unitType: recruitSelection,
        territoryId,
      });
      if (!result.ok) {
        setMessage(t(result.error ?? 'game:errors.unsupported'));
        return;
      }
      act(result.state, 'coin');
      advanceTutorial(3, 4);
      setRecruitSelection(undefined);
      return;
    }
    if (!selected || selected.ownerId !== player.id) return;
    const destination = game.territories.find(({ id }) => id === territoryId);
    if (!destination) return;
    const hostile = Boolean(
      (destination.ownerId && destination.ownerId !== player.id) ||
      game.units.some((unit) => unit.territoryId === territoryId && unit.ownerId !== player.id),
    );
    if (hostile) {
      setPendingAttack({ unitId: selected.id, territoryId });
      return;
    }
    commitMove(selected.id, territoryId, 'MOVE');
  };

  const pendingUnit = pendingAttack
    ? game.units.find(({ id }) => id === pendingAttack.unitId)
    : undefined;
  const pendingTerritory = pendingAttack
    ? game.territories.find(({ id }) => id === pendingAttack.territoryId)
    : undefined;
  const pendingPreview =
    pendingAttack && pendingUnit && pendingTerritory
      ? combatPreview(game, pendingUnit, pendingTerritory.id)
      : undefined;

  const confirmAttack = () => {
    if (!pendingAttack) return;
    commitMove(pendingAttack.unitId, pendingAttack.territoryId, 'ATTACK');
    setPendingAttack(undefined);
  };

  const cancelAttack = () => setPendingAttack(undefined);

  const endTurn = () => {
    let next = applyAction(game, { type: 'END_TURN', playerId: player.id }).state;
    setSelectedUnit(undefined);
    if (next.mode === 'hotseat') {
      setConcealed(true);
      act(next, 'turn');
      return;
    }
    if (activePlayer(next).isAI) {
      // The guided tutorial script references fixed territories (e.g. "recruit in
      // Carthage"); a fully competent opponent could capture them mid-tutorial and
      // invalidate the script, so the tutorial opponent stays passive.
      next =
        next.mode === 'tutorial'
          ? applyAction(next, { type: 'END_TURN', playerId: activePlayer(next).id }).state
          : runAITurn(next, 'strategist');
    }
    next = startActionPhase(next);
    act(next, 'turn');
    advanceTutorial(4, 5);
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
        <strong>{t('game:hud.objective')}</strong>{' '}
        {activeScenario ? t(activeScenario.objectiveKey) : t('game:objective.pax', { target: 8 })}
      </div>
      <div className="board-layout">
        <MapBoard
          state={game}
          selectedUnitId={selectedUnit}
          selectUnit={(id) => {
            setRecruitSelection(undefined);
            setSelectedUnit(id);
            playTone('select', preferences.sound);
            advanceTutorial(1, 2);
          }}
          chooseTerritory={chooseTerritory}
          recruitLegal={recruitLegal}
          objectiveTerritoryId={activeScenario?.objective.territoryId}
        />
        <aside className="action-panel stone-panel">
          <p className="phase-label">
            {t('game:hud.phase')} · {t(`game:phase.${game.phase}`)}
          </p>
          <button className="history-button" onClick={() => setHistoryOpen(true)}>
            {t('game:actions.history')}
          </button>
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
            {recruitSelection ? (
              <p className="status" role="status">
                {t('game:instructions.recruitPlacement', {
                  unit: t(`content:units.${recruitSelection}`),
                })}
              </p>
            ) : null}
            <div className="recruit-row">
              {(['infantry', 'cavalry', 'fleet'] as UnitType[]).map((type) => (
                <button
                  key={type}
                  aria-pressed={recruitSelection === type}
                  className={recruitSelection === type ? 'active' : ''}
                  onClick={() => {
                    setSelectedUnit(undefined);
                    setPendingAttack(undefined);
                    setRecruitSelection((current) => (current === type ? undefined : type));
                  }}
                >
                  <span>{type === 'infantry' ? '♟' : type === 'cavalry' ? '♞' : '⛵'}</span>
                  <small>
                    {t(`content:units.${type}`)}
                    <br />● {unitCost(player, type)}
                  </small>
                </button>
              ))}
            </div>
            {recruitSelection && (
              <button onClick={() => setRecruitSelection(undefined)}>{t('actions.cancel')}</button>
            )}
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
                    if (result.ok) {
                      act(result.state);
                      advanceTutorial(4, 5);
                    } else setMessage(t(result.error ?? 'game:errors.unsupported'));
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
              if (result.ok) {
                act(result.state);
                advanceTutorial(4, 5);
              } else setMessage(t(result.error ?? 'game:errors.unsupported'));
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
      {pendingAttack && pendingTerritory && pendingPreview && (
        <PixelDialog
          titleId="combat-confirm-title"
          title={t('game:combat.confirm', { territory: t(pendingTerritory.nameKey) })}
          role="alertdialog"
          onClose={cancelAttack}
        >
          <p>
            {t('game:combat.attackStrength', { value: pendingPreview.attack })} ·{' '}
            {t('game:combat.defenseStrength', { value: pendingPreview.defense })}
          </p>
          <p>
            {t('game:combat.outcome', {
              outcome: t(`game:combat.${pendingPreview.outcome}`),
            })}
          </p>
          <div className="panel-footer">
            <button onClick={cancelAttack}>{t('actions.cancel')}</button>
            <button className="primary" onClick={confirmAttack}>
              {t('game:actions.attack')}
            </button>
          </div>
        </PixelDialog>
      )}
      {game.winnerId && (
        <div className="scrim">
          <section className="dialog victory">
            <span>✦</span>
            <h2>
              {t(victoryTitleKey, {
                player: displayPlayer(winner?.name ?? ''),
              })}
            </h2>
            <button onClick={() => setScreen('menu')}>{t('actions.returnMenu')}</button>
          </section>
        </div>
      )}
      {historyOpen && (
        <HistoryPanel
          events={game.eventLog}
          formatEvent={formatEvent}
          onClose={() => setHistoryOpen(false)}
        />
      )}
      {overlays}
    </main>
  );
}
