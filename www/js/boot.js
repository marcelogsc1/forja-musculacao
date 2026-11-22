// Inicialização (carregado por último)
Platform.onBack(handleBack, backDepth);
Store.init();
setTimeout(probeAnim, 1500);
