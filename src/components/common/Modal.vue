<template>
    <teleport to=".theme">
        <transition name="modal" appear>
            <div v-if="isOpen" class="modal-container">
                <Panel id="modal" class="modal" v-bind="$attrs">
                    <template #header>
                        <div class="panel__header">
                            <div class="panel__title">
                                {{ title || name }}
                            </div>
                            <div class="panel__close" @click="close" @mouseenter="sound">
                                <Icon icon="close-thick" />
                            </div>
                        </div>
                    </template>
                    <slot />
                </Panel>
            </div>
        </transition>
    </teleport>
</template>

<script lang="ts">
export default {
    inheritAttrs: false
};
</script>

<script lang="ts" setup>
import { ref } from "vue";
import Panel from "@/components/common/Panel.vue";
import Icon from "@/components/common/Icon.vue";

type PanelProps = InstanceType<typeof Panel>["$props"];
interface ModalProps extends PanelProps {
    name: string;
    title?: string;
}

const props = withDefaults(defineProps<ModalProps>(), {
    title: undefined,
    is: "div",
    width: "initial",
    height: "initial",
    padding: "30px",
    activeTab: 0
});

const isOpen = api.modals.register(props.name);
const titleStr = ref(props.title || props.name);

const close = () => {
    api.modals.close(props.name);
};

const sound = () => api.audio.getSound("button-hover").play();
</script>