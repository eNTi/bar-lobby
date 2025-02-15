<template>
    <div :class="`fullsize theme theme--${theme.toLowerCase()}`" @click.left="leftClick" @click.right="rightClick">
        <DebugSidebar v-if="!isProduction" />
        <StatusInfo v-if="false" />
        <Background :blur="blurBg" />
        <IntroVideo v-if="state === 'intro'" @complete="onIntroEnd" />
        <Preloader v-else-if="state === 'preloader'" @complete="onPreloadDone" />
        <FirstTimeSetup v-else-if="state === 'first-time-setup'" @complete="firstTimeSetupComplete" />
        <template v-else>
            <NavBar :class="{ hidden: empty }" />
            <div :class="`view view--${route.name?.toString()}`">
                <Panel :class="{ hidden: empty }">
                    <router-view v-slot="{ Component }">
                        <transition mode="out-in" v-bind="currentTransition" :style="`--enter-duration: ${transitionDurationEnterMs}ms; --leave-duration: ${transitionDurationLeaveMs}ms;`" @after-leave="afterLeave">
                            <component :is="Component" />
                        </transition>
                    </router-view>
                </Panel>
            </div>
        </template>
    </div>
</template>

<script lang="ts" setup>
import * as fs from "fs";
import { Ref, TransitionProps } from "vue";
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import DebugSidebar from "@/components/misc/DebugSidebar.vue";
import NavBar from "@/components/misc/NavBar.vue";
import Preloader from "@/components/misc/Preloader.vue";
import Background from "@/components/misc/Background.vue";
import { playRandomMusic } from "@/utils/play-random-music";
import IntroVideo from "@/components/misc/IntroVideo.vue";
import Panel from "@/components/common/Panel.vue";
import StatusInfo from "./components/battle/StatusInfo.vue";
import { defaultMaps } from "@/config/default-maps";
import FirstTimeSetup from "@/components/misc/FirstTimeSetup.vue";

const isProduction = process.env.NODE_ENV === "production";

const router = useRouter();
const route = useRoute();
const state: Ref<"intro" | "preloader" | "first-time-setup" | "default"> = ref(api.settings.model.skipIntro.value ? "preloader" : "intro");
const theme = api.settings.model.theme;
const empty = ref(false);
const blurBg = ref(true);

const currentTransition: Ref<TransitionProps> = ref({});
const nextTransition : Ref<TransitionProps> = ref({});
const transitionDurationEnterMs = ref(0);
const transitionDurationLeaveMs = ref(0);

router.afterEach(async (to, from) => {
    currentTransition.value = route.redirectedFrom?.meta.transition ?? from?.meta?.transition ?? {};
    nextTransition.value = to?.meta?.transition ?? {};

    setTransitionDuration(currentTransition.value);

    empty.value = route?.meta?.empty ?? false;
    blurBg.value = route?.meta?.blurBg ?? blurBg.value;
});

const afterLeave = () => {
    currentTransition.value = nextTransition.value;

    setTransitionDuration(currentTransition.value);
};

const setTransitionDuration = (transition: TransitionProps) => {
    if (transition.duration) {
        if (typeof transition.duration === "number") {
            transitionDurationEnterMs.value = transition.duration;
            transitionDurationLeaveMs.value = transition.duration;
        } else {
            transitionDurationEnterMs.value = transition.duration.enter;
            transitionDurationLeaveMs.value = transition.duration.leave;
        }
    } else {
        transitionDurationEnterMs.value = 100;
        transitionDurationLeaveMs.value = 100;
    }
};

const onIntroEnd = () => {
    playRandomMusic();
    state.value = "preloader";
};

const onPreloadDone = () => {
    if (!fs.existsSync(api.settings.model.dataDir.value)) {
        state.value = "first-time-setup";
    } else {
        state.value = "default";
    }
};

const firstTimeSetupComplete = () => {
    state.value = "default";
};

api.content.engine.downloadLatestEngine();
api.content.game.updateGame();
api.content.maps.downloadMaps(defaultMaps);

router.replace("/");

const leftClick = () => api.session.onLeftClick.dispatch();
const rightClick = () => api.session.onRightClick.dispatch();
</script>