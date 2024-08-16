import {t, Trans} from "@lingui/macro";
import React, {ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState,} from "react";

import "./chip.scss";

import {makeVisualizationsWithId} from "@nand2tetris/components/chips/visualizations.js";
import {Clockface} from "@nand2tetris/components/clockface.js";
import {FullPinout, PinContext, PinResetDispatcher,} from "@nand2tetris/components/pinout.js";
import {useStateInitializer} from "@nand2tetris/components/react.js";
import {BaseContext} from "@nand2tetris/components/stores/base.context.js";
import {Files, isBuiltinOnly, PROJECT_NAMES,} from "@nand2tetris/components/stores/chip.store.js";
import {CHIP_PROJECTS} from "@nand2tetris/projects/base.js";
import {HDL} from "@nand2tetris/simulator/languages/hdl.js";
import {Timer} from "@nand2tetris/simulator/timer.js";
import {TestPanel} from "src/shell/test_panel";
import {AppContext} from "../App.context";
import {PageContext} from "../Page.context";
import {Editor} from "../shell/editor";
import {Accordian, Panel} from "../shell/panel";
import {zip} from "../shell/zip";
import useResizeObserver from "@react-hook/resize-observer";

const useScreenWidth = () => {
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);

    }, []);
    return screenWidth;

};

export const Chip = () => {
    const screenWidth = useScreenWidth();
    const {setStatus} = useContext(BaseContext);
    const {stores, setTool} = useContext(PageContext);
    const {tracking} = useContext(AppContext);
    const {state, actions, dispatch} = stores.chip;

    const [hdl, setHdl] = useStateInitializer(state.files.hdl);
    const [tst, setTst] = useStateInitializer(state.files.tst);
    const [cmp, setCmp] = useStateInitializer(state.files.cmp);
    const [out, setOut] = useStateInitializer(state.files.out);

    const hdlPanelRef = useRef<HTMLDivElement>(null);
    const partsPanelRef = useRef<HTMLDivElement>(null);
    const testPanelRef = useRef<HTMLDivElement>(null);
    //declare previous widths of panels
    const [prevHdlWidth, setPrevHdlWidth] = useState<number>();
    const [prevPartsPanelWidth, setPrevPartsPanelWidth] = useState<number>();
    const [initPartsPanelLeftPos, setInitPartsPanelLeftPos] = useState<number>();
    const [initTestPanelLeftPos, setInitTestPanelLeftPos] = useState<number>();


    useResizeObserver(hdlPanelRef, (entry) => {
        //move parts panel to the right according to width

        const {inlineSize: width} = entry.contentBoxSize[0];
        if (!prevHdlWidth) {
            setPrevHdlWidth(width);
            return;
        }
        if(prevHdlWidth !== width&&partsPanelRef.current&&initPartsPanelLeftPos&&initTestPanelLeftPos){
            partsPanelRef.current.style.left =  -initPartsPanelLeftPos + width + "px";
            partsPanelRef.current.style.width = initTestPanelLeftPos- partsPanelRef.current.offsetLeft + "px";
            setPrevHdlWidth(width);
        }
    });
    useResizeObserver(partsPanelRef, (entry) => {
        //move parts panel to the right according to width

        const {inlineSize: width} = entry.contentBoxSize[0];
        if(!prevPartsPanelWidth){
            setPrevPartsPanelWidth(width);
            return;
        }
        if(prevPartsPanelWidth !== width&&partsPanelRef.current&&testPanelRef.current&&initTestPanelLeftPos&&prevHdlWidth){
            const p = (width - initTestPanelLeftPos+prevHdlWidth)
            testPanelRef.current.style.left =  (width - initTestPanelLeftPos+prevHdlWidth)  + "px";
            testPanelRef.current.style.width = (screenWidth-initTestPanelLeftPos-p) + "px";
            setPrevPartsPanelWidth(width);
        }
    });


    useEffect(() => {
        if(partsPanelRef.current) {
            setInitPartsPanelLeftPos(partsPanelRef.current.offsetLeft)
            console.log("initPartsPanelLeftPos", partsPanelRef.current.offsetLeft)
        }
    }, [partsPanelRef.current]);


    useEffect(() => {
        if(testPanelRef.current) {
            setInitTestPanelLeftPos(testPanelRef.current.offsetLeft)
            console.log("Set initTestPanelLeftPos", testPanelRef.current.offsetLeft)
        }
    }, [testPanelRef.current]);

    useEffect(() => {
        setTool("chip");
    }, [setTool]);

    useEffect(() => {
        tracking.trackPage("/chip");
    }, [tracking]);

    useEffect(() => {
        tracking.trackEvent("action", "setProject", state.controls.project);
        tracking.trackEvent("action", "setChip", state.controls.chipName);
    }, []);

    const setProject = useCallback(
        (project: keyof typeof CHIP_PROJECTS) => {
            actions.setProject(project);
            tracking.trackEvent("action", "setProject", project);
        },
        [actions, tracking],
    );

    const setChip = useCallback(
        (chip: string) => {
            actions.setChip(chip);
            tracking.trackEvent("action", "setChip", chip);
            pinResetDispatcher.reset();
        },
        [actions, tracking],
    );

    const doEval = useCallback(() => {
        actions.eval();
        tracking.trackEvent("action", "eval");
    }, [actions, tracking]);

    const compile = useRef<(files?: Partial<Files>) => void>(() => undefined);
    compile.current = async (files: Partial<Files> = {}) => {
        const hdlToCompile =
            useBuiltin || state.controls.builtinOnly ? files.hdl : files.hdl ?? hdl;
        await actions.updateFiles({
            hdl: hdlToCompile,
            tst: files.tst ?? tst,
            cmp: files.cmp ?? cmp,
        });
    };

    useEffect(() => {
        compile.current({tst, cmp});
        actions.reset();
    }, [tst, cmp]);

    const runner = useRef<Timer>();
    useEffect(() => {
        runner.current = new (class ChipTimer extends Timer {
            async reset(): Promise<void> {
                await compile.current();
                await actions.reset();
            }

            override finishFrame(): void {
                super.finishFrame();
                dispatch.current({action: "updateTestStep"});
            }

            async tick(): Promise<boolean> {
                return await actions.stepTest();
            }

            toggle(): void {
                dispatch.current({action: "updateTestStep"});
            }
        })();

        return () => {
            runner.current?.stop();
        };
    }, [compile, actions, dispatch]);

    const clockActions = useMemo(
        () => ({
            toggle() {
                actions.clock();
                tracking.trackEvent("action", "toggleClock");
            },
            reset() {
                tracking.trackEvent("action", "resetClock");
                actions.reset();
            },
        }),
        [actions],
    );

    const downloadRef = useRef<HTMLAnchorElement>(null);

    const downloadProject = async () => {
        if (!downloadRef.current) {
            return;
        }

        const files = await actions.getProjectFiles();
        const url = await zip(files);
        downloadRef.current.href = url;
        downloadRef.current.download = `${state.controls.project}`;
        downloadRef.current.click();

        URL.revokeObjectURL(url);
    };

    const [useBuiltin, setUseBuiltin] = useState(false);
    const toggleUseBuiltin = () => {
        if (useBuiltin) {
            setUseBuiltin(false);
            actions.useBuiltin(false);
        } else {
            setUseBuiltin(true);
            actions.useBuiltin(true, hdl);
        }
        pinResetDispatcher.reset();
    };

    const selectors = (
        <>
            <fieldset role="group">
                <select
                    value={state.controls.project}
                    onChange={({target: {value}}) => {
                        setProject(value as keyof typeof CHIP_PROJECTS);
                    }}
                    data-testid="project-picker"
                >
                    {PROJECT_NAMES.map(([number, label]) => (
                        <option key={number} value={number}>
                            {label}
                        </option>
                    ))}
                </select>
                <select
                    value={state.controls.chipName}
                    onChange={({target: {value}}) => {
                        setChip(value);
                    }}
                    data-testid="chip-picker"
                >
                    {state.controls.chips.map((chip) => (
                        <option
                            key={chip}
                            value={chip}
                            style={
                                isBuiltinOnly(state.controls.project, chip)
                                    ? {color: "var(--light-grey)"}
                                    : {}
                            }
                        >
                            {`${chip} ${
                                isBuiltinOnly(state.controls.project, chip) ? "(given)" : ""
                            }`}
                        </option>
                    ))}
                </select>
                <a ref={downloadRef} style={{display: "none"}}/>

                <button
                    className="flex-0"
                    onClick={downloadProject}
                    disabled={state.controls.builtinOnly}
                    data-tooltip={t`Download .hdl files`}
                    data-placement="left"
                >
                    ⬇️
                </button>
            </fieldset>
        </>
    );
    const hdlPanel = (
        <Panel
            className="_hdl_panel"
            isEditorPanel={true}
            panelRef={hdlPanelRef}
            header={
                <>
                    <div tabIndex={0}>HDL</div>
                    <fieldset>
                        <label>
                            <input
                                type="checkbox"
                                role="switch"
                                checked={state.controls.builtinOnly ? true : useBuiltin}
                                onChange={toggleUseBuiltin}
                                disabled={state.controls.builtinOnly}
                            />
                            <Trans>Builtin</Trans>
                        </label>
                    </fieldset>
                    {selectors}
                </>
            }
        >
            <Editor
                className="flex-1"
                value={hdl}
                error={state.controls.error}
                onChange={async (source) => {
                    setHdl(source);
                    if (!useBuiltin) {
                        await actions.saveChip(source);
                    }
                    compile.current(
                        useBuiltin || state.controls.builtinOnly ? {} : {hdl: source},
                    );
                }}
                grammar={HDL.parser}
                language={"hdl"}
                disabled={useBuiltin || state.controls.builtinOnly}
            />
        </Panel>
    );

    const [inputValid, setInputValid] = useState(true);

    const showCannotTestError = () => {
        setStatus(t`Cannot test a chip that has syntax errors`);
    };

    const evalIfCan = () => {
        if (state.sim.invalid) {
            showCannotTestError();
            return;
        }
        doEval();
    };

    const chipButtons = (
        <fieldset role="group">
            <button
                onClick={evalIfCan}
                onKeyDown={evalIfCan}
                disabled={!state.sim.pending || !inputValid}
            >
                <Trans>Eval</Trans>
            </button>
            <button
                onClick={() => {
                    if (state.sim.invalid) {
                        showCannotTestError();
                        return;
                    }
                    clockActions.reset();
                }}
                style={{maxWidth: "initial"}}
                disabled={!state.sim.clocked}
            >
                <Trans>Reset</Trans>
            </button>
            <button
                onClick={() => {
                    if (state.sim.invalid) {
                        showCannotTestError();
                        return;
                    }
                    clockActions.toggle();
                }}
                style={{minWidth: "7em", textAlign: "start"}}
                disabled={!state.sim.clocked}
            >
                <Trans>Clock</Trans>:{"\u00a0"}
                <Clockface/>
            </button>
        </fieldset>
    );

    const visualizations: [string, ReactNode][] = makeVisualizationsWithId(
        {
            parts: state.sim.chip,
        },
        () => {
            dispatch.current({action: "updateChip"});
        },
        state.controls.visualizationParameters,
    );

    const pinResetDispatcher = new PinResetDispatcher();

    const pinsPanel = (
        <Panel
            className="_parts_panel"
            panelRef={partsPanelRef}
            header={
                <>
                    <div>
                        <Trans>Chip</Trans> {state.controls.chipName}
                    </div>
                    {chipButtons}
                </>
            }
        >
            {state.sim.invalid ? (
                <Trans>Syntax errors in the HDL code or test</Trans>
            ) : (
                <>
                    <PinContext.Provider value={pinResetDispatcher}>
                        <FullPinout
                            sim={state.sim}
                            toggle={actions.toggle}
                            setInputValid={setInputValid}
                            hideInternal={state.controls.builtinOnly || useBuiltin}
                        />
                    </PinContext.Provider>
                    {visualizations.length > 0 && (
                        <Accordian summary={<Trans>Visualization</Trans>} open={true}>
                            <main>{visualizations.map(([_, v]) => v)}</main>
                        </Accordian>
                    )}
                </>
            )}
        </Panel>
    );

    const testPanel = (
        <TestPanel
            runner={runner}
            disabled={state.sim.invalid}
            showLoad={false}
            panelRef={testPanelRef}
            prefix={
                state.controls.tests.length > 1 ? (
                    <select
                        value={state.controls.testName}
                        onChange={({target: {value}}) => {
                            actions.setTest(value);
                        }}
                        data-testid="test-picker"
                    >
                        {state.controls.tests.map((test) => (
                            <option key={test} value={test}>
                                {test}
                            </option>
                        ))}
                    </select>
                ) : (
                    <></>
                )
            }
            tst={[tst, setTst, state.controls.span]}
            cmp={[cmp, setCmp]}
            out={[out, setOut]}
            speed={state.config.speed}
            onSpeedChange={(speed) => {
                dispatch.current({action: "updateConfig", payload: {speed}});
            }}
        />
    );

    return (
        <div className="Page ChipPage grid">
            {hdlPanel}
            {pinsPanel}
            {testPanel}
        </div>
    );
};

export default Chip;
