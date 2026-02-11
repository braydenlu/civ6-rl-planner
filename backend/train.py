import os
from typing import Any, Callable

from sb3_contrib.common.wrappers import ActionMasker
from sb3_contrib.ppo_mask import MaskablePPO
from stable_baselines3.common.callbacks import CheckpointCallback
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.utils import set_random_seed
from stable_baselines3.common.vec_env import SubprocVecEnv

from backend.logger import setup_logger

from .civenv import CivEnv
from .utils import load_map_from_json

logger = setup_logger(__name__)

MAP_COUNT = 11

init_function = Callable[[], Monitor[Any, Any]]


def make_env(rank: int, seed: int = 0) -> init_function:
    def _init() -> Monitor[Any, Any]:
        log_dir = "../civ_ai_logs/"
        os.makedirs(log_dir, exist_ok=True)

        template_maps = []
        for i in range(MAP_COUNT):
            civ_map = load_map_from_json(f"maps/civ_test_map{i}.json")
            template_maps.append(civ_map)

        env = CivEnv(template_maps)
        env = ActionMasker(env, lambda e: e.action_mask())
        env = Monitor(env, filename=os.path.join(log_dir, str(rank)))

        env.reset(seed=seed + rank)
        return env

    set_random_seed(seed)
    return _init


if __name__ == "__main__":
    num_envs = 4

    vec_env = SubprocVecEnv([make_env(rank=i, seed=42) for i in range(num_envs)])

    model = MaskablePPO(
        "MlpPolicy",
        vec_env,
        verbose=1,
        tensorboard_log="./civ_ai_logs/",
        clip_range=0.2,
        max_grad_norm=0.5,
        learning_rate=1e-4,
        ent_coef=0.02,
        n_steps=512,
        batch_size=128,
    )

    checkpoint_callback = CheckpointCallback(
        save_freq=100_000, save_path="./agents/checkpoints/", name_prefix="civ_agent"
    )

    logger.info("Training... Press Ctrl+C to stop and save.")
    model.learn(total_timesteps=1000000, callback=checkpoint_callback)

    model.save("./agents/civ_agent_v1.0")
    logger.info("Model saved!")
